import { Match as MatchNamespace, MatchServerEvents } from '@magic3t/api-types'
import { Team } from '@magic3t/common-types'
import {
  BotName,
  MatchEventRow,
  MatchRow,
  SingleBotConfig,
  UserRatingSnapshotRow,
  UserRow,
} from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { unexpected } from '@/common'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { ConfigRepository } from '@/infra/firestore'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { RankConverter, RatingState } from '@/modules/rating'
import { BaseBot, LmmBot, RandomBot } from './bots'
import { FinishedMatchContext } from './events/match-finished-event'
import { Match, MatchClassEventType, MatchClassSummary, MatchStore, Perspective } from './lib'
import { matchException } from './types/match-error'

export type MatchCreationError = 'user-not-found' | 'bot-not-found'
const HUMAN_VS_BOT_TIMELIMIT = 180 * 1000 // 3 minutes per player
const HUMAN_VS_HUMAN_TIMELIMIT = 240 * 1000 // 4 minutes per player
const TEAMS: [Team, Team] = [Team.Order, Team.Chaos]

@Injectable()
export class MatchService {
  constructor(
    private configRepository: ConfigRepository,
    private userRepository: UserRepository,
    private matchBank: MatchStore,
    private eventEmitter: EventEmitter2,
    private websocketEmitterService: WebsocketEmitterService
  ) {}

  /**
   * Create a new Player vs Bot match, returning the match id.
   */
  async createPlayerVsBot(userId: string, botId: BotName): Promise<string> {
    // Get profiles
    const userProfilePromise = this.getProfile(userId)
    const botConfig = await this.configRepository.getBotConfig(botId)
    if (!botConfig) matchException(MatchNamespace.MatchError.BotNotFound, 404)

    const [userProfile, botProfile] = await Promise.all([
      userProfilePromise,
      this.getProfile(botConfig.uid),
    ])

    // Coin flip sides
    const humanTeam = TEAMS[Math.round(Math.random())]
    const [orderProfile, chaosProfile] =
      humanTeam === Team.Order ? [userProfile, botProfile] : [botProfile, userProfile]

    // Get perspectives
    const { match, id } = this.matchBank.createAndRegisterMatch({
      timelimit: HUMAN_VS_BOT_TIMELIMIT,
    })
    const { orderPerspective, chaosPerspective } = this.matchBank.createPerspectives({
      match,
      orderId: orderProfile.uuid,
      chaosId: chaosProfile.uuid,
    })

    // Get bot, passing perspective
    const bot = this.getBot(
      botConfig,
      humanTeam === Team.Order ? chaosPerspective : orderPerspective
    )

    // Sync
    this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

    // Start match
    match.start()
    bot.start()
    return id
  }

  /**
   * Creates a bot vs bot match for testing and balancing purposes.
   */
  async createBotVsBotMatch(name1: BotName, name2: BotName) {
    // Get bot configs
    const [config1, config2] = await Promise.all([
      this.configRepository.getBotConfig(name1),
      this.configRepository.getBotConfig(name2),
    ])
    if (!config1 || !config2) unexpected('Could not find bot config(s) for bot vs bot match.')

    // Get bot profiles
    const [profile1, profile2] = await Promise.all([
      this.getProfile(config1.uid),
      this.getProfile(config2.uid),
    ])

    // Coinflip profiles
    const sideOfFirst = TEAMS[Math.round(Math.random())]
    const [orderProfile, chaosProfile] =
      sideOfFirst === Team.Order ? [profile1, profile2] : [profile2, profile1]

    // Create and register match
    const { match } = this.matchBank.createAndRegisterMatch({
      timelimit: 60 * 1000,
    })

    // Create perspectives
    const { orderPerspective, chaosPerspective } = await this.matchBank.createPerspectives({
      match,
      orderId: config1.uid,
      chaosId: config2.uid,
    })

    // Get bots, passing perspectives
    const order = this.getBot(config1, orderPerspective)
    const chaos = this.getBot(config2, chaosPerspective)

    // Sync
    this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

    // Start match and bots
    match.start()

    order.start()
    chaos.start()
    return match
  }

  /**
   * Create a new Player vs Player match.
   */
  async createPvPMatch(userId1: string, userId2: string) {
    // Get profiles
    const [profile1, profile2] = await Promise.all([
      this.getProfile(userId1),
      this.getProfile(userId2),
    ])

    // Coinflips sides
    const sideOfFirst = TEAMS[Math.round(Math.random())]
    const [orderProfile, chaosProfile] =
      sideOfFirst === Team.Order ? [profile1, profile2] : [profile2, profile1]

    // Create and register a match in match bank
    const { match, id } = this.matchBank.createAndRegisterMatch({
      timelimit: HUMAN_VS_HUMAN_TIMELIMIT,
    })

    // Register perspectives for both players in match bank
    this.matchBank.createPerspectives({
      match,
      orderId: orderProfile.uuid,
      chaosId: chaosProfile.uuid,
    })

    // Sync
    this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

    // Start match
    match.start()
    return id
  }

  /**
   * Returns the oponent user id for a given user id.
   */
  getOpponent(userId: string): string | null {
    return this.matchBank.getOpponent(userId)
  }

  /**
   * Checks if a user is available to join a match (not currently in a match). Used by the queue service.
   */
  isAvailable(userId: string) {
    return !this.matchBank.containsUser(userId)
  }

  async getEventByRow(row: MatchEventRow): Promise<MatchNamespace.GetMatchResultEvent> {
    if (row.type === 'forfeit' || row.type === 'timeout') {
      return {
        event: row.type,
        team: row.team,
        time: row.time_ms,
      }
    }
    return {
      choice: row.choice!,
      event: 'choice',
      team: row.team,
      time: row.time_ms,
    }
  }

  async getMatchByRow(
    match: MatchRow & {
      events: MatchEventRow[]
      orderRating: UserRatingSnapshotRow
      chaosRating: UserRatingSnapshotRow
    },
    rankConverter?: RankConverter
  ): Promise<MatchNamespace.GetMatchResult> {
    const converter = await (async () => {
      if (rankConverter) return rankConverter
      const ratingConfig = await this.configRepository.getRatingConfig()
      return new RankConverter(ratingConfig)
    })()

    const orderRank = converter.getRankFromElo(
      match.orderRating.score,
      match.orderRating.hidden ? 0 : null,
      match.orderRating.apex_flag
    )

    const orderGain =
      match.order_delta !== null
        ? converter.getTotalLP(match.order_delta) - converter.getTotalLP(0)
        : null

    const chaosRank = converter.getRankFromElo(
      match.chaosRating.score,
      match.chaosRating.hidden ? 0 : null,
      match.chaosRating.apex_flag
    )

    const chaosGain =
      match.chaos_delta !== null
        ? converter.getTotalLP(match.chaos_delta) - converter.getTotalLP(0)
        : null

    return {
      uuid: match.uuid,
      events: match.events.map(this.getEventByRow.bind(this)),
      date: match.date,
      winner: match.winner,
      order: {
        lpGain: orderGain,
        nickname: match.order_nickname,
        rank: orderRank,
        score: match.order_match_score,
        uuid: match.order_uuid,
      },
      chaos: {
        lpGain: chaosGain,
        nickname: match.chaos_nickname,
        rank: chaosRank,
        score: match.chaos_match_score,
        uuid: match.chaos_uuid,
      },
    }
  }

  async getListedMatchByRow(
    match: MatchRow & {
      orderRating: UserRatingSnapshotRow
      chaosRating: UserRatingSnapshotRow
    },
    rankConverter?: RankConverter
  ): Promise<MatchNamespace.ListMatchesResultItem> {
    const converter = await (async () => {
      if (rankConverter) return rankConverter
      const ratingConfig = await this.configRepository.getRatingConfig()
      return new RankConverter(ratingConfig)
    })()

    const orderRank = converter.getRankFromElo(
      match.orderRating.score,
      match.orderRating.hidden ? 0 : null,
      match.orderRating.apex_flag
    )

    const orderGain =
      match.order_delta !== null
        ? converter.getTotalLP(match.order_delta) - converter.getTotalLP(0)
        : null

    const chaosRank = converter.getRankFromElo(
      match.chaosRating.score,
      match.chaosRating.hidden ? 0 : null,
      match.chaosRating.apex_flag
    )

    const chaosGain =
      match.chaos_delta !== null
        ? converter.getTotalLP(match.chaos_delta) - converter.getTotalLP(0)
        : null

    return {
      uuid: match.uuid,
      date: match.date,
      winner: match.winner,
      order: {
        lpGain: orderGain,
        nickname: match.order_nickname,
        rank: orderRank,
        score: match.order_match_score,
        uuid: match.order_uuid,
      },
      chaos: {
        lpGain: chaosGain,
        nickname: match.chaos_nickname,
        rank: chaosRank,
        score: match.chaos_match_score,
        uuid: match.chaos_uuid,
      },
    }
  }

  /**
   * Listens to match class events and re-emits them as application events so that other services can listen to them.
   */
  private subscribeMatchEvents(
    match: Match,
    order: UserRow,
    chaos: UserRow,
    ranked: boolean,
    startedAt: Date
  ) {
    // Subscribe to any events that can change the state of the game and send state reports via websockets.
    match.onMany(
      [
        MatchClassEventType.Choice,
        MatchClassEventType.Surrender,
        MatchClassEventType.Timeout,
        MatchClassEventType.Finish,
      ],
      () => {
        const stateReport = match.stateReport
        for (const player of [order, chaos]) {
          // Validate that the player is not a bot
          if (player.role !== 'bot') {
            this.websocketEmitterService.send(
              player.uuid,
              'match',
              MatchServerEvents.StateReport,
              stateReport
            )
          }
        }
      }
    )

    // Subscribe to match finished event
    match.on(MatchClassEventType.Finish, async (summary) => {
      const orderScore = computeOrderScore(summary)
      const chaosScore = 1 - orderScore

      const [newOrderRating, newChaosRating, rankConverter] = await (async () => {
        const orderRatingState: RatingState = {
          elo: order.rating_score,
          kFactor: order.rating_k_factor,
          rankedCount: order.rating_ranked_count,
          apexFlag: order.rating_apex_flag,
        }
        const chaosRatingState: RatingState = {
          elo: chaos.rating_score,
          kFactor: chaos.rating_k_factor,
          rankedCount: chaos.rating_ranked_count,
          apexFlag: chaos.rating_apex_flag,
        }
        if (!ranked) return [orderRatingState, chaosRatingState, null]

        const ratingConfig = await this.configRepository.getRatingConfig()
        const rankConverter = new RankConverter(ratingConfig)
        return [
          ...rankConverter.updateRatings([orderRatingState, chaosRatingState], orderScore),
          rankConverter,
        ]
      })()

      // Create a finished event
      const finishEvent: FinishedMatchContext = {
        order: {
          row: order,
          matchScore: orderScore,
          timeSpent: summary.order.timeSpent,
          newRating: newOrderRating,
        },
        chaos: {
          row: chaos,
          matchScore: chaosScore,
          timeSpent: summary.chaos.timeSpent,
          newRating: newChaosRating,
        },
        events: match.events,
        ranked,
        rankConverter: rankConverter!,
        startedAt,
        winner: match.winner,
      }

      // Emit the finished event for other services to persist results, send events, etc.
      this.eventEmitter.emit('match.finished', finishEvent)
    })

    function computeOrderScore(summary: MatchClassSummary): number {
      if (summary.winner === Team.Order) return 1
      if (summary.winner === Team.Chaos) return 0
      return summary.chaos.timeSpent / (summary.order.timeSpent + summary.chaos.timeSpent || 1)
    }
  }

  private getBot(botConfig: SingleBotConfig, perspective: Perspective): BaseBot {
    return botConfig.model === 'lmm'
      ? new LmmBot(perspective, botConfig.depth)
      : new RandomBot(perspective)
  }

  private async getProfile(userId: string): Promise<UserRow> {
    const profile = await this.userRepository.getByFirebaseId(userId)
    if (!profile)
      unexpected('match service should never try to get a profile that does not exist', userId)
    return profile
  }
}
