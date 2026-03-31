export type BanType = 'temporary' | 'permanent'

export interface UserBan {
  type: BanType
  reason?: string
  bannedAt: Date
  expiresAt: Date | null // Only for temporary bans
  bannedBy: string // userId of the creator
}
