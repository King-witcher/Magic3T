import { MatchDocumentEventType } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { DatabaseService } from '@/infra/database/database.service'
import { MatchRepository } from '@/infra/database/repositories/match-repository'
import { UserRatingSnapshotRepository } from '@/infra/database/repositories/user-rating-snapshot-repository'
import { FinishedMatchContext } from './events/match-finished-event'

@Injectable()
export class PersistanceService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly matchRepository: MatchRepository,
    private readonly snapshotRepository: UserRatingSnapshotRepository
  ) {}

  @OnEvent('match.finished')
  async persistMatch(summary: FinishedMatchContext): Promise<void> {
    await this.databaseService.transaction(async (client) => {
      let orderRatingId: number | null
      let chaosRatingId: number | null
      let orderDelta: number | null
      let chaosDelta: number | null

      if (summary.ranked) {
        // Create new snapshots and recover their generated ids
        const now = new Date()

        orderRatingId = await this.snapshotRepository.createReturningId(
          {
            user_id: summary.order.row.id,
            score: summary.order.newRating.elo,
            apex_flag: summary.order.newRating.apexFlag,
            hidden: false,
            date: now,
          },
          client
        )

        chaosRatingId = await this.snapshotRepository.createReturningId(
          {
            user_id: summary.chaos.row.id,
            score: summary.chaos.newRating.elo,
            apex_flag: summary.chaos.newRating.apexFlag,
            hidden: false,
            date: now,
          },
          client
        )

        // Delta = new elo - old elo, rounded to nearest integer
        orderDelta = Math.round(summary.order.newRating.elo - summary.order.row.rating_score)
        chaosDelta = Math.round(summary.chaos.newRating.elo - summary.chaos.row.rating_score)
      } else {
        // Point to the latest existing snapshot for each player
        const [orderSnapshot, chaosSnapshot] = await Promise.all([
          this.snapshotRepository.findLatestByUserId(summary.order.row.id, client),
          this.snapshotRepository.findLatestByUserId(summary.chaos.row.id, client),
        ])

        orderRatingId = orderSnapshot?.id ?? null
        chaosRatingId = chaosSnapshot?.id ?? null
        orderDelta = null
        chaosDelta = null
      }

      const winner: 'order' | 'chaos' | null = summary.winner ?? null

      const events = summary.events
        .filter(
          (e) =>
            e.event === MatchDocumentEventType.Choice ||
            e.event === MatchDocumentEventType.Forfeit ||
            e.event === MatchDocumentEventType.Timeout
        )
        .map((e, index) => ({
          sequence: index,
          time_ms: e.time,
          type:
            e.event === MatchDocumentEventType.Choice
              ? ('choice' as const)
              : e.event === MatchDocumentEventType.Forfeit
                ? ('forfeit' as const)
                : ('timeout' as const),
          team: e.side,
          choice: e.event === MatchDocumentEventType.Choice ? e.choice : null,
        }))

      await this.matchRepository.persist(
        {
          match: {
            order_id: summary.order.row.id,
            order_nickname: summary.order.row.profile_nickname,
            order_match_score: summary.order.matchScore,
            order_old_rating: orderRatingId,
            order_delta: orderDelta,
            order_time_spent: summary.order.timeSpent,

            chaos_id: summary.chaos.row.id,
            chaos_nickname: summary.chaos.row.profile_nickname,
            chaos_old_rating: chaosRatingId,
            chaos_delta: chaosDelta,
            chaos_time_spent: summary.chaos.timeSpent,

            winner,
          },
          events,
        },
        client
      )
    })
  }
}
