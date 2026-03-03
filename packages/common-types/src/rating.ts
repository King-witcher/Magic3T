export const enum League {
  Provisional = 'provisional',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond',
  Master = 'master',
  Challenger = 'challenger',
}

export type Division = 1 | 2 | 3 | 4

/**
 * Represents the rank of a user from the client's perspective.
 */
export type ClientRank = {
  league: League
  division: Division | null
  points: number | null
  /** @deprecated Should be queried from the owner */
  progress: number
}
