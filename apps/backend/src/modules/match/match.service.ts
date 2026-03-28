import { Match as MatchNamespace, MatchServerEvents } from '@magic3t/api-types'
import { BotId, League, Team } from '@magic3t/common-types'
import { MatchEventRow, UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { unexpected } from '@/common'
import {
  FullyJoinedMatchRow,
  MatchRepository,
  MatchRowWithRatings,
} from '@/infra/database/repositories/match-repository'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { ConfigRepository } from '@/infra/firestore'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { RankConverter, RatingState } from '@/modules/rating'
import { BaseBot, MinMaxBot, RandomBot } from './bots'
import { BotsService } from './bots.service'
import { FinishedMatchContext as FinishedMatchSummary } from './events/match-finished-event'
import { Match, MatchClassEventType, MatchClassSummary, MatchStore, Perspective } from './lib'

export type MatchCreationError = 'user-not-found' | 'bot-not-found'
const HUMAN_VS_BOT_TIMELIMIT = 180 * 1000 // 3 minutes per player
const HUMAN_VS_HUMAN_TIMELIMIT = 240 * 1000 // 4 minutes per player
const TEAMS: [Team, Team] = [Team.Order, Team.Chaos]

@Injectable()
export class MatchService {
  constructor(
    private configRepository: ConfigRepository,
    private userRepository: UserRepository,
    private matchRepository: MatchRepository,
    private matchBank: MatchStore,
    private eventEmitter: EventEmitter2,
    private websocketEmitterService: WebsocketEmitterService,
    private botsService: BotsService
  ) {}

  /**
   * Create a new Player vs Bot match, returning the match id.
   */
  async createPlayerVsBot(userId: string, botId: BotId): Promise<string> {
    // Get profiles
    const userProfilePromise = this.userRepository.getById(userId)

    const [userProfile, botProfile] = await Promise.all([
      userProfilePromise,
      this.botsService.getUser(botId),
    ])

    if (!userProfile) unexpected('User not found for player vs bot match creation', userId)

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
      orderId: orderProfile.id,
      chaosId: chaosProfile.id,
    })

    // Get bot, passing perspective
    const bot = this.botsService.getBot(
      botId,
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
  // async createBotVsBotMatch(name1: BotName, name2: BotName) {
  //   // Get bot configs
  //   const [config1, config2] = await Promise.all([
  //     this.configRepository.getBotConfig(name1),
  //     this.configRepository.getBotConfig(name2),
  //   ])
  //   if (!config1 || !config2) unexpected('Could not find bot config(s) for bot vs bot match.')

  //   // Get bot profiles
  //   const [profile1, profile2] = await Promise.all([
  //     this.getProfile(config1.id),
  //     this.getProfile(config2.uid),
  //   ])

  //   // Coinflip profiles
  //   const sideOfFirst = TEAMS[Math.round(Math.random())]
  //   const [orderProfile, chaosProfile] =
  //     sideOfFirst === Team.Order ? [profile1, profile2] : [profile2, profile1]

  //   // Create and register match
  //   const { match } = this.matchBank.createAndRegisterMatch({
  //     timelimit: 60 * 1000,
  //   })

  //   // Create perspectives
  //   const { orderPerspective, chaosPerspective } = await this.matchBank.createPerspectives({
  //     match,
  //     orderId: config1.uid,
  //     chaosId: config2.uid,
  //   })

  //   // Get bots, passing perspectives
  //   const order = this.getBot(config1, orderPerspective)
  //   const chaos = this.getBot(config2, chaosPerspective)

  //   // Sync
  //   this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

  //   // Start match and bots
  //   match.start()

  //   order.start()
  //   chaos.start()
  //   return match
  // }

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
      orderId: orderProfile.id,
      chaosId: chaosProfile.id,
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
    match: FullyJoinedMatchRow,
    rankConverter?: RankConverter
  ): Promise<MatchNamespace.GetMatchResult> {
    const converter = await (async () => {
      if (rankConverter) return rankConverter
      const ratingConfig = await this.configRepository.getRatingConfig()
      return new RankConverter(ratingConfig)
    })()

    const provisionalRank: MatchNamespace.GetMatchResultTeam['rank'] = {
      league: League.Provisional,
      division: null,
      points: null,
      rankedCount: 0,
    }

    const orderRank = match.order_rating
      ? converter.getRankFromElo(
          match.order_rating.score,
          match.order_rating.hidden ? 0 : null,
          match.order_rating.apex_flag
        )
      : provisionalRank

    const orderGain =
      match.order_delta !== null
        ? converter.getTotalLP(match.order_delta) - converter.getTotalLP(0)
        : null

    const chaosRank = match.chaos_rating
      ? converter.getRankFromElo(
          match.chaos_rating.score,
          match.chaos_rating.hidden ? 0 : null,
          match.chaos_rating.apex_flag
        )
      : provisionalRank

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
        uuid: match.order_id,
      },
      chaos: {
        lpGain: chaosGain,
        nickname: match.chaos_nickname,
        rank: chaosRank,
        score: match.chaos_match_score,
        uuid: match.chaos_id,
      },
    }
  }

  async getListedMatchByRow(
    match: MatchRowWithRatings,
    rankConverter?: RankConverter
  ): Promise<MatchNamespace.ListMatchesResultItem> {
    const converter = await (async () => {
      if (rankConverter) return rankConverter
      const ratingConfig = await this.configRepository.getRatingConfig()
      return new RankConverter(ratingConfig)
    })()

    const provisionalRank: MatchNamespace.GetMatchResultTeam['rank'] = {
      league: League.Provisional,
      division: null,
      points: null,
      rankedCount: 0,
    }

    const orderRank = match.order_rating
      ? converter.getRankFromElo(
          match.order_rating.score,
          match.order_rating.hidden ? 0 : null,
          match.order_rating.apex_flag
        )
      : provisionalRank

    const orderGain =
      match.order_delta !== null
        ? converter.getTotalLP(match.order_delta) - converter.getTotalLP(0)
        : null

    const chaosRank = match.chaos_rating
      ? converter.getRankFromElo(
          match.chaos_rating.score,
          match.chaos_rating.hidden ? 0 : null,
          match.chaos_rating.apex_flag
        )
      : provisionalRank

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
        uuid: match.order_id,
      },
      chaos: {
        lpGain: chaosGain,
        nickname: match.chaos_nickname,
        rank: chaosRank,
        score: match.chaos_match_score,
        uuid: match.chaos_id,
      },
    }
  }

  async getMatchByUuid(uuid: string): Promise<MatchNamespace.GetMatchResult> {
    const [row, ratingConfig] = await Promise.all([
      this.matchRepository.getByUuid(uuid),
      this.configRepository.getRatingConfig(),
    ])

    if (!row) throw Object.assign(new Error('Match not found'), { code: 'match-not-found' })

    const rankConverter = new RankConverter(ratingConfig)
    return this.getMatchByRow(row, rankConverter)
  }

  async listMatchesByUserUuid(
    uuid: string,
    limit: number
  ): Promise<MatchNamespace.ListMatchesResult> {
    const [rows, ratingConfig] = await Promise.all([
      this.matchRepository.getByUserUuid(uuid, limit),
      this.configRepository.getRatingConfig(),
    ])

    const rankConverter = new RankConverter(ratingConfig)
    const matches = await Promise.all(
      rows.map((row) => this.getListedMatchByRow(row, rankConverter))
    )

    return { matches }
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
              player.id,
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

      let newOrderRating = orderRatingState
      let newChaosRating = chaosRatingState
      let rankConverter: RankConverter | null = null

      if (ranked) {
        const ratingConfig = await this.configRepository.getRatingConfig()
        rankConverter = new RankConverter(ratingConfig)
        ;[newOrderRating, newChaosRating] = rankConverter.updateRatings(
          [orderRatingState, chaosRatingState],
          orderScore
        )
      }

      const computePlayerRanking = (
        oldRow: { rating_score: number; rating_ranked_count: number },
        newRating: RatingState
      ) => {
        if (!rankConverter) {
          return {
            newRank: {
              league: League.Provisional,
              division: null,
              points: null,
              rankedCount: 0,
            } as const,
            lpGain: null,
          }
        }

        const newRank = rankConverter.getRankFromElo(
          newRating.elo,
          newRating.rankedCount,
          newRating.apexFlag
        )

        const hasLpGain =
          ranked && oldRow.rating_ranked_count >= rankConverter.config.min_ranked_count
        const lpGain = hasLpGain
          ? rankConverter.getTotalLP(newRating.elo) - rankConverter.getTotalLP(oldRow.rating_score)
          : null

        return { newRank, lpGain }
      }

      const orderRanking = computePlayerRanking(order, newOrderRating)
      const chaosRanking = computePlayerRanking(chaos, newChaosRating)

      const finishEvent: FinishedMatchSummary = {
        order: {
          row: order,
          matchScore: orderScore,
          timeSpent: summary.order.timeSpent,
          newRating: newOrderRating,
          newRank: orderRanking.newRank,
          lpGain: orderRanking.lpGain,
        },
        chaos: {
          row: chaos,
          matchScore: chaosScore,
          timeSpent: summary.chaos.timeSpent,
          newRating: newChaosRating,
          newRank: chaosRanking.newRank,
          lpGain: chaosRanking.lpGain,
        },
        events: match.events,
        ranked,
        startedAt,
        winner: match.winner,
      }

      this.eventEmitter.emit('match.finished', finishEvent)
    })

    function computeOrderScore(summary: MatchClassSummary): number {
      if (summary.winner === Team.Order) return 1
      if (summary.winner === Team.Chaos) return 0
      return summary.chaos.timeSpent / (summary.order.timeSpent + summary.chaos.timeSpent || 1)
    }
  }

  private getBot(botId: BotId, perspective: Perspective): BaseBot {
    switch (botId) {
      case BotId.Recruit:
        return new RandomBot(perspective)
      case BotId.Soldier:
        return new MinMaxBot(perspective, 2)
      case BotId.Legend:
        return new MinMaxBot(perspective, 4)
      case BotId.Elite:
        return new MinMaxBot(perspective, 7)
      default:
        unexpected('Tried to get bot with invalid bot id', botId)
    }
  }

  private async getProfile(userId: string): Promise<UserRow> {
    const profile = await this.userRepository.getById(userId)
    if (!profile)
      unexpected('match service should never try to get a profile that does not exist', userId)
    return profile
  }
}
