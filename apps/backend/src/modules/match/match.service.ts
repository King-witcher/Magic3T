import { MatchServerEvents } from '@magic3t/api-types'
import { BotId, League, Team } from '@magic3t/common-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { unexpected } from '@/common'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { ConfigRepository } from '@/infra/firestore'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { RankConverter, RatingState } from '@/modules/rating'
import { BotsService } from './bots.service'
import { FinishedMatchSummary } from './events/match-finished-event'
import { Match, MatchClassEventType, MatchClassSummary, MatchStore } from './lib'

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
          ? rankConverter.getLpGain(oldRow.rating_score, newRating.elo)
          : null

        return { newRank, lpGain }
      }

      const orderRanking = computePlayerRanking(order, newOrderRating)
      const chaosRanking = computePlayerRanking(chaos, newChaosRating)

      const finishEvent: FinishedMatchSummary = {
        order: {
          userId: order.id,
          nickname: order.profile_nickname,
          role: order.role,
          previousElo: order.rating_score,
          matchScore: orderScore,
          timeSpent: summary.order.timeSpent,
          newRating: newOrderRating,
          newClientRank: orderRanking.newRank,
          lpGain: orderRanking.lpGain,
        },
        chaos: {
          userId: chaos.id,
          nickname: chaos.profile_nickname,
          role: chaos.role,
          previousElo: chaos.rating_score,
          matchScore: chaosScore,
          timeSpent: summary.chaos.timeSpent,
          newRating: newChaosRating,
          newClientRank: chaosRanking.newRank,
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

  private async getProfile(userId: string): Promise<UserRow> {
    const profile = await this.userRepository.getById(userId)
    if (!profile)
      unexpected('match service should never try to get a profile that does not exist', userId)
    return profile
  }
}
