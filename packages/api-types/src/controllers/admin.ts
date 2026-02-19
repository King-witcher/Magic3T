export type BanUserBody = {
  /** The ID of the user to ban */
  userId: string

  /** The reason for the ban */
  reason: string

  /** Duration in minutes (undefined for permanent ban) */
  durationMinutes?: number
}

export type UnbanUserBody = {
  /** The ID of the user to unban */
  userId: string
}

export type BanUserResult = {
  success: boolean
  bannedUntil?: Date
}

export type UnbanUserResult = {
  success: boolean
}
