import type { INTEGER, TIMESTAMPTZ, VARCHAR } from '../postgres'

export type UserCredentialRow = {
  username_slug: VARCHAR
  password_digest: VARCHAR
  user_id: INTEGER
  password_last_changed: TIMESTAMPTZ
}
