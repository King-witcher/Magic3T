import { UUID } from 'node:crypto'
import type { TEXT } from '../postgres'

export type UserIdentityProvider = 'firebase'

export type UserIdentityRow = {
  provider: UserIdentityProvider
  provider_user_id: TEXT
  user_id: UUID
}
