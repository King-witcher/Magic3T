import type { DATE, INTEGER, REAL, SMALLINT, TIMESTAMPTZ, UUID, VARCHAR } from '../postgres'

export type UserRowRole = 'bot' | 'player' | 'admin' | 'superuser'

export type UserApexFlag = 'challenger' | 'grandmaster'

export type UserRow = {
  id: INTEGER
  uuid: UUID

  role: UserRowRole
  credits: INTEGER
  xp: INTEGER

  profile_nickname: VARCHAR
  profile_nickname_slug: VARCHAR
  profile_nickname_date: TIMESTAMPTZ
  profile_icon: SMALLINT

  rating_score: REAL
  rating_k_factor: REAL
  rating_apex_flag: UserApexFlag | null
  rating_ranked_count: SMALLINT
  rating_date: DATE

  stats_victories: INTEGER
  stats_draws: INTEGER
  stats_defeats: INTEGER

  created_at: TIMESTAMPTZ
}
