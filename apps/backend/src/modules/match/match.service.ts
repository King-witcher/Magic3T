import { BotId, Team } from '@magic3t/common-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { unexpected } from '@/common'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { RatingService, UserRatingFields } from '@/modules/rating'
import { BotsService } from './bots.service'
import { FinishedMatchSummary } from './events/match-finished-event'
import { Match, MatchClassEventType, MatchClassSummary, MatchStore } from './lib'

const HUMAN_VS_BOT_TIMELIMIT = 180 * 1000 // 3 minutes per player
const HUMAN_VS_HUMAN_TIMELIMIT = 240 * 1000 // 4 minutes per player
const TEAMS: [Team, Team] = ['order', 'chaos']

@Injectable()
export class MatchService {
  constructor(
    private userRepository: UserRepository,
    private matchBank: MatchStore,
    private eventEmitter: EventEmitter2,
    private websocketEmitterService: WebsocketEmitterService,
    private botsService: BotsService,
    private ratingService: RatingService
  ) {}

  /**
   * Create a new Player vs Bot match, returning the match id.
   */
  async createPlayerVsBot(userId: string, botId: BotId): Promise<string> {
    const userProfilePromise = this.userRepository.getById(userId)

    const [userProfile, botProfile] = await Promise.all([
      userProfilePromise,
      this.botsService.getUser(botId),
    ])

    if (!userProfile) unexpected('User not found for player vs bot match creation', userId)

    const humanTeam = TEAMS[Math.round(Math.random())]
    const [orderProfile, chaosProfile] =
      humanTeam === 'order' ? [userProfile, botProfile] : [botProfile, userProfile]

    const { match, id } = this.matchBank.createAndRegisterMatch({
      timelimit: HUMAN_VS_BOT_TIMELIMIT,
    })
    const { orderPerspective, chaosPerspective } = this.matchBank.createPerspectives({
      match,
      orderId: orderProfile.id,
      chaosId: chaosProfile.id,
    })

    const bot = this.botsService.getBot(
      botId,
      humanTeam === 'order' ? chaosPerspective : orderPerspective
    )

    this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

    match.start()
    bot.start()
    return id
  }

  /**
   * Create a new Player vs Player match.
   */
  async createPvPMatch(userId1: string, userId2: string) {
    const [profile1, profile2] = await Promise.all([
      this.getProfile(userId1),
      this.getProfile(userId2),
    ])

    const sideOfFirst = TEAMS[Math.round(Math.random())]
    const [orderProfile, chaosProfile] =
      sideOfFirst === 'order' ? [profile1, profile2] : [profile2, profile1]

    const { match, id } = this.matchBank.createAndRegisterMatch({
      timelimit: HUMAN_VS_HUMAN_TIMELIMIT,
    })

    this.matchBank.createPerspectives({
      match,
      orderId: orderProfile.id,
      chaosId: chaosProfile.id,
    })

    this.subscribeMatchEvents(match, orderProfile, chaosProfile, true, new Date())

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

  private subscribeMatchEvents(
    match: Match,
    order: UserRow,
    chaos: UserRow,
    ranked: boolean,
    startedAt: Date
  ) {
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
          if (player.role !== 'bot') {
            this.websocketEmitterService.send(player.id, 'match', 'state-report', stateReport)
          }
        }
      }
    )

    match.on(MatchClassEventType.Finish, async (summary) => {
      const orderScore = computeOrderScore(summary)
      const chaosScore = 1 - orderScore

      const orderFields: UserRatingFields = {
        mmr_score: order.mmr_score,
        mmr_k_factor: order.mmr_k_factor,
        rank_league: order.rank_league,
        rank_division: order.rank_division,
        rank_lp: order.rank_lp,
        rank_matches: order.rank_matches,
        rank_date: order.rank_date,
      }
      const chaosFields: UserRatingFields = {
        mmr_score: chaos.mmr_score,
        mmr_k_factor: chaos.mmr_k_factor,
        rank_league: chaos.rank_league,
        rank_division: chaos.rank_division,
        rank_lp: chaos.rank_lp,
        rank_matches: chaos.rank_matches,
        rank_date: chaos.rank_date,
      }

      let newOrderRating = orderFields
      let newChaosRating = chaosFields
      let orderLpGain: number | null = null
      let chaosLpGain: number | null = null

      if (ranked) {
        const { results, lpGains } = this.ratingService.computeMatchResult(
          orderFields,
          chaosFields,
          orderScore
        )
        if (order.role !== 'bot') {
          newOrderRating = results[0]
          orderLpGain = lpGains[0]
        }
        if (chaos.role !== 'bot') {
          newChaosRating = results[1]
          chaosLpGain = lpGains[1]
        }
      }

      const finishEvent: FinishedMatchSummary = {
        order: {
          userId: order.id,
          nickname: order.profile_nickname,
          role: order.role,
          matchScore: orderScore,
          timeSpent: summary.order.timeSpent,
          newRating: newOrderRating,
          lpGain: orderLpGain,
        },
        chaos: {
          userId: chaos.id,
          nickname: chaos.profile_nickname,
          role: chaos.role,
          matchScore: chaosScore,
          timeSpent: summary.chaos.timeSpent,
          newRating: newChaosRating,
          lpGain: chaosLpGain,
        },
        events: match.events,
        ranked,
        startedAt,
        winner: match.winner,
      }

      this.eventEmitter.emit('match.finished', finishEvent)
    })

    function computeOrderScore(summary: MatchClassSummary): number {
      if (summary.winner === 'order') return 1
      if (summary.winner === 'chaos') return 0
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
