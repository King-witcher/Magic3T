import { League } from '@magic3t/common-types'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { unexpected } from '@/common'
import { DatabaseService } from '@/infra/database/database.service'
import { UserRepository } from '@/infra/database/repositories'
import { MatchRepository } from '@/infra/database/repositories/match-repository'
import { UserRatingSnapshotRepository } from '@/infra/database/repositories/user-rating-snapshot-repository'
import { IDbClient } from '@/shared/database'
import { FinishedMatchSummary } from './events/match-finished-event'

@Injectable()
export class PersistanceService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly matchRepository: MatchRepository,
    private readonly snapshotRepository: UserRatingSnapshotRepository,
    private readonly userRepository: UserRepository
  ) {}

  @OnEvent('match.finished')
  async persistMatch(summary: FinishedMatchSummary): Promise<void> {
    await this.databaseService.transaction(async (conn) => {
      await this.saveMatch(summary, conn)
      await this.updateUserRatings(summary, conn)
    })
  }

  private async updateUserRatings(summary: FinishedMatchSummary, conn: IDbClient): Promise<void> {
    const updateIfNotBot = async (
      player: FinishedMatchSummary['order' | 'chaos'],
      conn: IDbClient
    ) => {
      if (player.role !== 'bot') {
        await this.userRepository.updateRating(
          player.userId,
          {
            rating_apex_flag: player.newRating.apexFlag,
            rating_k_factor: player.newRating.kFactor,
            rating_ranked_count: player.newRating.rankedCount,
            rating_score: player.newRating.elo,
          },
          conn
        )
        await this.snapshotRepository.create(
          {
            user_id: player.userId,
            apex_flag: player.newRating.apexFlag,
            date: new Date(),
            hidden: player.newClientRank.league !== League.Provisional,
            score: player.newRating.elo,
          },
          conn
        )
      }
    }

    await updateIfNotBot(summary.order, conn)
    await updateIfNotBot(summary.chaos, conn)
  }

  private async saveMatch(summary: FinishedMatchSummary, conn: IDbClient): Promise<void> {
    const [orderSnap, chaosSnap] = await Promise.all([
      this.snapshotRepository.findLatestByUserId(summary.order.userId, conn),
      this.snapshotRepository.findLatestByUserId(summary.chaos.userId, conn),
    ])

    if (!orderSnap)
      unexpected('should always find a rating snapshot for order player', summary.order.userId)
    if (!chaosSnap)
      unexpected('should always find a rating snapshot for chaos player', summary.chaos.userId)

    await this.matchRepository.persist(
      {
        match: {
          order_lp_gain: summary.order.lpGain,
          chaos_lp_gain: summary.chaos.lpGain,
          order_id: summary.order.userId,
          chaos_id: summary.chaos.userId,
          order_nickname: summary.order.nickname,
          chaos_nickname: summary.chaos.nickname,
          order_old_rating: orderSnap.id,
          chaos_old_rating: chaosSnap.id,
          order_time_spent: summary.order.timeSpent,
          chaos_time_spent: summary.chaos.timeSpent,
          order_match_score: summary.order.matchScore,
          winner: summary.winner,
        },
        events: summary.events,
      },
      conn
    )
  }
}
