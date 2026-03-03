import type { INTEGER, TEXT } from '../postgres'

export type UserIdentityProvider = 'firebase'

export type UserIdentityRow = {
  provider: UserIdentityProvider
  provider_user_id: TEXT
  user_id: INTEGER
}
