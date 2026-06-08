export type League = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'challenger'

export type Division = 1 | 2 | 3 | 4

/**
 * Represents the rank of a user from the client's perspective.
 * league === null means the user is in placement (not yet ranked).
 */
export type ClientRank = {
  league: League | null
  division: Division | null
  lp: number | null
}
