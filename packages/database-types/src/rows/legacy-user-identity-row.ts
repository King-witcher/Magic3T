import type { CHAR, UUID, VARCHAR } from '../postgres'

export type LegacyUserIdentityRow = {
  firebase_id: CHAR
  email: VARCHAR
  user_id: UUID
}
