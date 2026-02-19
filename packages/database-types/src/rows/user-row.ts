/** Stores the Elo-related information for a user */
export type UserRowElo = {
  /** The user's Elo score */
  score: number

  /** The number of ranked matches played by the user */
  matches: number

  /** The k-factor used in Elo calculations to determine how much the score changes after each match */
  k: number

  /** Determines whether an apex tier player is challenger. This field is needed since challenger tier is updated once every day. */
  challenger: boolean
}

export const enum UserRole {
  Player = 'player',
  Creator = 'creator',
  Bot = 'bot',
}

export type UserBan = {
  /** Whether the user is currently banned */
  isBanned: boolean

  /** The reason for the ban */
  reason?: string

  /** Date when the user was banned */
  bannedAt?: Date

  /** Date when the ban expires (undefined for permanent bans) */
  expiresAt?: Date

  /** ID of the admin who banned the user */
  bannedBy?: string
}

export type UserRow = {
  identification: {
    /** Nickname slug used to identify the user uniquely */
    unique_id: string // slug
    nickname: string
    last_changed: Date
  }

  experience: number

  /** Credits bought with money */
  magic_points: number // bought with money

  /** Credits earned by playing the game */
  perfect_squares: number

  /** The summoner icon id chosen by the user */
  summoner_icon: number

  role: UserRole

  elo: UserRowElo

  stats: {
    wins: number
    draws: number
    defeats: number
  }

  /** Ban information */
  ban?: UserBan
}
