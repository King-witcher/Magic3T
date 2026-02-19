export type BanUserCommand = {
  /**
   * The reason for the ban.
   */
  reason: string
  /**
   * Duration of the ban in seconds. If null or omitted, the ban is permanent.
   */
  duration?: number | null
}

export type BanInfo = {
  reason: string
  /** ISO date string of expiry. null means permanent. */
  expiresAt: string | null
}
