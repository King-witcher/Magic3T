/** Command to ban a user */
export type BanUserCommand = {
  /** The ID of the user to ban */
  userId: string

  /** The type of ban: 'permanent' or 'temporary' */
  type: 'permanent' | 'temporary'

  /** The reason for the ban */
  reason: string

  /** Duration in seconds (required for temporary bans) */
  duration?: number
}

/** Command to unban a user */
export type UnbanUserCommand = {
  /** The ID of the user to unban */
  userId: string
}

/** Result of a ban operation */
export type BanUserResult = {
  success: boolean
  userId: string
  type: 'permanent' | 'temporary'
  expiresAt?: string
}

/** Result of an unban operation */
export type UnbanUserResult = {
  success: boolean
  userId: string
}

/** Ban information returned in API responses */
export type BanInfo = {
  type: 'permanent' | 'temporary'
  reason: string
  issuedAt: string
  expiresAt?: string
  issuedBy: string
}
