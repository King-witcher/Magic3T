import type { CHAR, DATE, INTEGER, REAL, SMALLINT, TIMESTAMP, UUID, VARCHAR } from '../postgres'

export type user_role = 'player' | 'admin' | 'superuser'

export type user_apex_flag = 'challenger' | 'grandmaster'

export type UserRow = {
  id: INTEGER
  uuid: UUID
  firebase_id: CHAR | null
  role: user_role
  credits: INTEGER
  xp: INTEGER

  profile_nickname: VARCHAR
  profile_nickname_slug: VARCHAR
  profile_nickname_date: TIMESTAMP
  profile_icon: SMALLINT

  rating_score: REAL
  rating_k_factor: REAL
  rating_apex: user_apex_flag | null
  rating_series_played: SMALLINT
  rating_date: DATE

  stats_victories: INTEGER
  stats_draws: INTEGER
  stats_defeats: INTEGER
}
