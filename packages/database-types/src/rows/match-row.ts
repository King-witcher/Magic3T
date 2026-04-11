import type { FLOAT, INTEGER, SMALLINT, TIMESTAMPTZ, UUID, VARCHAR } from '../postgres'

export type MatchTeam = 'order' | 'chaos'

export type MatchRow = {
  id: INTEGER
  uuid: UUID

  order_id: UUID | null
  order_nickname: VARCHAR
  order_match_score: FLOAT
  order_old_rating: INTEGER | null
  order_lp_gain: SMALLINT | null
  order_time_spent: SMALLINT

  chaos_id: UUID | null
  chaos_nickname: VARCHAR
  chaos_match_score: FLOAT
  chaos_old_rating: INTEGER | null
  chaos_lp_gain: SMALLINT | null
  chaos_time_spent: SMALLINT

  winner: MatchTeam | null
  total_time_spent: SMALLINT
  date: TIMESTAMPTZ
}
