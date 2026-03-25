import type { TIMESTAMPTZ, UUID, VARCHAR } from '../postgres'

export type UserCredentialRow = {
  username_slug: VARCHAR
  user_id: UUID
  algorithm: 'bcrypt' | 'argon2'
  password_digest: VARCHAR
  password_last_changed: TIMESTAMPTZ
}
