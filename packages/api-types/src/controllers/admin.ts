import type { UserBanType } from '@magic3t/database-types'

export type BanUserCommand = {
  type: UserBanType
  /** Required for temporary bans. Duration in seconds. */
  durationSeconds?: number
  /** Optional ban reason. */
  reason?: string
}
