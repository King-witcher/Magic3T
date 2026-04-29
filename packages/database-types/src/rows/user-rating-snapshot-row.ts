import type { INTEGER, REAL, SMALLINT, TIMESTAMPTZ, UUID } from '../postgres'
import { LeagueEnum } from '../types'

export type UserRatingSnapshotRow = {
  id: INTEGER
  user_id: UUID

  league: LeagueEnum | null
  division: SMALLINT | null
  lp: SMALLINT | null
  matches: INTEGER

  mmr_score: REAL
  mmr_k_factor: REAL

  date: TIMESTAMPTZ
}
