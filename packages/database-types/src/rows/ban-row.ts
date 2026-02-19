/**
 * Represents a ban record for a user.
 * Stores information about user bans (temporary or permanent).
 */
export type BanRow = {
  /** The ID of the user who was banned */
  banned_user_id: string

  /** The nickname of the banned user at the time of the ban */
  banned_user_nickname: string

  /** The ID of the creator who issued the ban */
  creator_id: string

  /** Whether the ban is permanent (true) or temporary (false) */
  is_permanent: boolean

  /** The reason for the ban */
  reason: string

  /** The timestamp when the ban was issued */
  banned_at: Date

  /** The timestamp when the ban will expire (null for permanent bans) */
  expires_at: Date | null
}
