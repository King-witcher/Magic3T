import {
  MatchEventRow,
  MatchRow,
  UserApexFlag,
  UserRatingSnapshotRow,
} from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { IDbClient, INSERT_INTO } from '@/shared/database'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'

export type PersistMatchInput = {
  match: Omit<MatchRow, 'id' | 'uuid' | 'chaos_match_score' | 'total_time_spent' | 'date'>
  events: Omit<MatchEventRow, 'match_id'>[]
}

export type ListableMatch = MatchRow & {
  orderRating: UserRatingSnapshotRow | null
  chaosRating: UserRatingSnapshotRow | null
}

type MatchWithRatingsFlat = MatchRow & {
  order_rating_id: number | null
  order_rating_user_id: string | null
  order_rating_score: number | null
  order_rating_apex_flag: UserApexFlag | null
  order_rating_hidden: boolean | null
  order_rating_date: Date | null
  chaos_rating_id: number | null
  chaos_rating_user_id: string | null
  chaos_rating_score: number | null
  chaos_rating_apex_flag: UserApexFlag | null
  chaos_rating_hidden: boolean | null
  chaos_rating_date: Date | null
}

@Injectable()
export class MatchRepository {
  private readonly logger = new Logger(MatchRepository.name, { timestamp: true })

  constructor(private readonly databaseService: DatabaseService) {}

  async persist(input: PersistMatchInput, client?: IDbClient): Promise<void> {
    client ??= this.databaseService

    const insertMatch = INSERT_INTO<Partial<MatchRow>>('match', input.match).RETURNING`id`
    const [{ id: matchId }] = await client.query<{ id: number }>(insertMatch)

    if (input.events.length > 0) {
      const eventsWithMatchId = input.events.map((e) => ({ ...e, match_id: matchId }))
      const insertEvents = INSERT_INTO<MatchEventRow>('match_event', ...eventsWithMatchId)
      await client.query(insertEvents)
    }
  }

  async getByUserUuid(uuid: string, limit: number): Promise<ListableMatch[]> {
    const rows = await this.databaseService.query<MatchWithRatingsFlat>(sql`
      SELECT
        m.*,
        ors.id             AS order_rating_id,
        ors.user_id        AS order_rating_user_id,
        ors.score          AS order_rating_score,
        ors.apex_flag      AS order_rating_apex_flag,
        ors.hidden         AS order_rating_hidden,
        ors.date           AS order_rating_date,
        crs.id             AS chaos_rating_id,
        crs.user_id        AS chaos_rating_user_id,
        crs.score          AS chaos_rating_score,
        crs.apex_flag      AS chaos_rating_apex_flag,
        crs.hidden         AS chaos_rating_hidden,
        crs.date           AS chaos_rating_date
      FROM match m
      LEFT JOIN user_rating_snapshot ors ON ors.id = m.order_old_rating
      LEFT JOIN user_rating_snapshot crs ON crs.id = m.chaos_old_rating
      WHERE m.order_id = ${uuid} OR m.chaos_id = ${uuid}
      ORDER BY m.id DESC
      LIMIT ${limit}
    `)

    return rows.map((row): ListableMatch => {
      const {
        order_rating_id,
        order_rating_user_id,
        order_rating_score,
        order_rating_apex_flag,
        order_rating_hidden,
        order_rating_date,
        chaos_rating_id,
        chaos_rating_user_id,
        chaos_rating_score,
        chaos_rating_apex_flag,
        chaos_rating_hidden,
        chaos_rating_date,
        ...matchRow
      } = row

      const orderRating: UserRatingSnapshotRow | null =
        order_rating_id !== null
          ? {
              id: order_rating_id,
              user_id: order_rating_user_id!,
              score: order_rating_score!,
              apex_flag: order_rating_apex_flag,
              hidden: order_rating_hidden!,
              date: order_rating_date!,
            }
          : null

      const chaosRating: UserRatingSnapshotRow | null =
        chaos_rating_id !== null
          ? {
              id: chaos_rating_id,
              user_id: chaos_rating_user_id!,
              score: chaos_rating_score!,
              apex_flag: chaos_rating_apex_flag,
              hidden: chaos_rating_hidden!,
              date: chaos_rating_date!,
            }
          : null

      return { ...matchRow, orderRating, chaosRating }
    })
  }
}
