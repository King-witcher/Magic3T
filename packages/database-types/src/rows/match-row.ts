import type { DATE, FLOAT, INTEGER, SMALLINT, UUID, VARCHAR } from '../postgres'

export type MatchTeam = 'order' | 'chaos'

export type MatchRow = {
  id: INTEGER
  uuid: UUID

  order_id: INTEGER | null
  order_nickname: VARCHAR
  chaos_id: INTEGER | null
  chaos_nickname: VARCHAR

  winner: MatchTeam | null

  match_order_score: FLOAT
  match_chaos_score: FLOAT

  old_order_rating: INTEGER | null
  old_chaos_rating: INTEGER | null
  order_delta: SMALLINT | null
  chaos_delta: SMALLINT | null

  order_time_spent: SMALLINT
  chaos_time_spent: SMALLINT

  total_time_spent: SMALLINT

  date: DATE
}
