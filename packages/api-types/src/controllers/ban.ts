export type BanUserCommand = {
  /** The ID of the user to ban */
  userId: string

  /** Whether the ban is permanent (true) or temporary (false) */
  isPermanent: boolean

  /** The duration in milliseconds for temporary bans (ignored if isPermanent is true) */
  durationMs?: number

  /** The reason for the ban */
  reason: string
}

export type BanUserResponse = {
  /** The ID of the banned user */
  userId: string

  /** The nickname of the banned user */
  nickname: string

  /** Whether the ban is permanent */
  isPermanent: boolean

  /** The expiration timestamp (null for permanent bans) */
  expiresAt: Date | null

  /** The reason for the ban */
  reason: string
}

export type UnbanUserCommand = {
  /** The ID of the user to unban */
  userId: string
}

export type ListBansResult = {
  data: BanUserResponse[]
}
