import type { INTEGER, VARCHAR } from '../postgres'

export type UserPasswordIdentityRow = {
  username_slug: VARCHAR
  password_digest: VARCHAR
  user_id: INTEGER
}
