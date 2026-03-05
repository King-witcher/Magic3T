import type { FLOAT, INTEGER, SMALLINT, TIMESTAMPTZ, UUID, VARCHAR } from '../postgres'

export type MatchTeam = 'order' | 'chaos'

export type MatchRow = {
  id: INTEGER
  uuid: UUID

  order_uuid: UUID | null
  order_nickname: VARCHAR
  order_match_score: FLOAT
  order_rating_id: INTEGER | null
  order_delta: SMALLINT | null
  order_time_spent: SMALLINT

  chaos_uuid: UUID | null
  chaos_nickname: VARCHAR
  chaos_match_score: FLOAT
  chaos_rating_id: INTEGER | null
  chaos_delta: SMALLINT | null
  chaos_time_spent: SMALLINT

  winner: MatchTeam | null
  total_time_spent: SMALLINT
  date: TIMESTAMPTZ
}
