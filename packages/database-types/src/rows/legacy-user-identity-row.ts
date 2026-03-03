import type { CHAR, INTEGER, VARCHAR } from '../postgres'

export type LegacyUserIdentityRow = {
  firebase_id: CHAR
  email: VARCHAR
  user_id: INTEGER
}
