import { MatchEventRow, MatchRow, UserRatingSnapshotRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { IDbClient, INSERT_INTO } from '@/shared/database'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'

export type PersistMatchInput = {
  match: Omit<MatchRow, 'id' | 'uuid' | 'chaos_match_score' | 'total_time_spent' | 'date'>
  events: Omit<MatchEventRow, 'match_id'>[]
}

export type MatchRowWithRatings = MatchRow & {
  order_rating: Omit<UserRatingSnapshotRow, 'id' | 'user_id'> | null
  chaos_rating: Omit<UserRatingSnapshotRow, 'id' | 'user_id'> | null
}

export type FullyJoinedMatchRow = MatchRowWithRatings & {
  events: Omit<MatchEventRow, 'match_id' | 'sequence'>[]
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

  async getByUserUuid(uuid: string, limit: number): Promise<MatchRowWithRatings[]> {
    const rows = await this.databaseService.query<MatchRowWithRatings>(sql`
      SELECT m.*,
            -- TODO: Remove unnecessary fields from the rating snapshots
            ROW_TO_JSON(ors.*) AS order_rating,
            ROW_TO_JSON(crs.*) AS chaos_rating

      FROM match m
              LEFT JOIN user_rating_snapshot ors
                        ON ors.id = m.order_old_rating
              LEFT JOIN user_rating_snapshot crs
                        ON crs.id = m.chaos_old_rating
      WHERE m.order_id = ${uuid}
        OR m.chaos_id = ${uuid}
      GROUP BY m.id, ors.id, crs.id
      LIMIT ${limit};
    `)

    return rows
  }

  async getByUuid(uuid: string): Promise<FullyJoinedMatchRow | null> {
    const rows = await this.databaseService.query<FullyJoinedMatchRow>(sql`
      SELECT m.*,
            -- TODO: Remove unnecessary fields from the rating snapshots
            ROW_TO_JSON(ors.*)          AS order_rating,
            ROW_TO_JSON(crs.*)          AS chaos_rating,
            COALESCE(JSON_AGG(ROW_TO_JSON(me.*)) FILTER (WHERE me.type IS NOT NULL), '[]') AS events

      FROM match m
              LEFT JOIN user_rating_snapshot ors
                        ON ors.id = m.order_old_rating
              LEFT JOIN user_rating_snapshot crs
                        ON crs.id = m.chaos_old_rating
              LEFT JOIN match_event me
                        ON me.match_id = m.id
      WHERE m.uuid = ${uuid}
      GROUP BY m.id, ors.id, crs.id;
    `)

    if (rows.length === 0) return null

    return rows[0]
  }
}
