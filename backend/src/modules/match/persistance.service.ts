import { Team } from '@magic3t/common-types'
import { MatchRow, MatchRowGameMode, UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { FieldValue, UpdateData } from 'firebase-admin/firestore'
import { MatchRepository, UserRepository } from '@/infra/firestore'
import { RatingService } from '@/modules/rating'
import { MatchFinishedEvent } from './events/match-finished-event'

/**
 * Service responsible for persisting match results and updating user statistics after a match is finished.
 */
@Injectable()
export class PersistanceService {
  constructor(
    private usersRepository: UserRepository,
    private matchesRepository: MatchRepository,
    private ratingService: RatingService
  ) {}

  // Updates user rows after match is finished, considering rating changes if ranked.
  @OnEvent('match.finished')
  async updateUser(matchSummary: MatchFinishedEvent) {
    const winner = this.getWinner(matchSummary)

    // Get UpdateData for wins, draws and losses
    const orderUpdate = this.buildStatsUpdate(winner, 'order')
    const chaosUpdate = this.buildStatsUpdate(winner, 'chaos')

    // Update Elos if ranked
    if (matchSummary.ranked) {
      orderUpdate.elo = matchSummary.order.newRating
      chaosUpdate.elo = matchSummary.chaos.newRating
    }

    // Update both users
    await Promise.all([
      this.usersRepository.update(matchSummary.order.id, orderUpdate),
      this.usersRepository.update(matchSummary.chaos.id, chaosUpdate),
    ])
  }

  // Persists the match row after match is finished.
  @OnEvent('match.finished')
  async persistMatch(matchSummary: MatchFinishedEvent) {
    const winner = this.getWinner(matchSummary)

    // Get old and new ratings
    const oldOrderRating = await this.ratingService.getRatingConverter(
      matchSummary.order.row.data.elo
    )
    const oldChaosRating = await this.ratingService.getRatingConverter(
      matchSummary.chaos.row.data.elo
    )

    // Get up to date ratings
    const newOrderRating = await this.ratingService.getRatingConverter(matchSummary.order.newRating)
    const newChaosRating = await this.ratingService.getRatingConverter(matchSummary.chaos.newRating)

    // Calculate LP gains
    const orderLpGain = newOrderRating.getLpGapAgainst(oldOrderRating)
    const chaosLpGain = newChaosRating.getLpGapAgainst(oldChaosRating)

    // Create a match row to persist
    const row: MatchRow = {
      [Team.Order]: {
        division: newOrderRating.division,
        league: newOrderRating.league,
        lp_gain: orderLpGain,
        name: matchSummary.order.row.data.identification.nickname,
        score: matchSummary.order.matchScore,
        uid: matchSummary.order.id,
      },
      [Team.Chaos]: {
        division: newChaosRating.division,
        league: newChaosRating.league,
        lp_gain: chaosLpGain,
        name: matchSummary.chaos.row.data.identification.nickname,
        score: matchSummary.chaos.matchScore,
        uid: matchSummary.chaos.id,
      },
      events: matchSummary.events,
      game_mode: matchSummary.ranked ? MatchRowGameMode.Ranked : MatchRowGameMode.Casual,
      winner: winner === 'chaos' ? Team.Chaos : winner === 'order' ? Team.Order : null,
      timestamp: matchSummary.startedAt,
    }

    // Persist the match row
    await this.matchesRepository.create(row)
  }

  private getWinner(matchSummary: MatchFinishedEvent): 'order' | 'chaos' | 'draw' {
    if (matchSummary.order.matchScore === 1) return 'order'
    if (matchSummary.chaos.matchScore === 1) return 'chaos'
    return 'draw'
  }

  private buildStatsUpdate(
    winner: 'order' | 'chaos' | 'draw',
    playerType: 'order' | 'chaos'
  ): UpdateData<UserRow> {
    const update: UpdateData<UserRow> = {}

    if (playerType === winner) {
      update['stats.wins'] = FieldValue.increment(1)
    } else if (winner === 'draw') {
      update['stats.draws'] = FieldValue.increment(1)
    } else {
      update['stats.defeats'] = FieldValue.increment(1)
    }

    return update
  }
}
