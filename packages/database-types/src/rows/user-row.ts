import type { INTEGER, REAL, SMALLINT, TIMESTAMPTZ, UUID, VARCHAR } from '../postgres'
import { LeagueEnum, UserRoleEnum } from '../types'

export type UserRow = {
  id: UUID

  role: UserRoleEnum
  credits: INTEGER
  xp: INTEGER

  profile_nickname: VARCHAR
  profile_nickname_slug: VARCHAR
  profile_nickname_date: TIMESTAMPTZ
  profile_icon: SMALLINT

  mmr_score: REAL
  mmr_k_factor: REAL

  rank_league: LeagueEnum | null
  rank_division: SMALLINT | null
  rank_lp: SMALLINT | null
  rank_matches: INTEGER
  rank_date: TIMESTAMPTZ

  stats_victories: INTEGER
  stats_draws: INTEGER
  stats_defeats: INTEGER

  created_at: TIMESTAMPTZ
}
