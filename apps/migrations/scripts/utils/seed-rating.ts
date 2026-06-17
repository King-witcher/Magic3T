/**
 * Dependency-free copy of the rating math from the backend's
 * `apps/backend/src/modules/rating/rating.service.ts`.
 *
 * The seed uses the raw-MMR Elo update plus the MMR→rank mapping — the same
 * path the live server takes for imported users (`getRankFromLegacyMmr`). Each
 * simulated match updates MMR with the real Elo formula and rank is read
 * straight off MMR, so users, snapshots and lp gains stay consistent with how
 * the app derives a rating. Keep in sync with RatingService if it changes.
 */

export type League = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'challenger'

export type RatingFields = {
  mmr_score: number
  mmr_k_factor: number
  rank_league: League | null
  rank_division: number | null
  rank_lp: number | null
  rank_matches: number
  rank_date: Date
}

type Rank = { league: League; division: number | null; lp: number }

const LEAGUES: League[] = ['bronze', 'silver', 'gold', 'diamond', 'master', 'challenger']
const APEX_LEAGUES = new Set<League>(['master', 'challenger'])

const BASE_MMR = 1500
const BASE_LEAGUE_INDEX = LEAGUES.indexOf('silver')

const MMR_PER_DIVISION = 50
const LP_PER_DIVISION = 100
const DIVISIONS_PER_LEAGUE = 4

const BRONZE_4_MMR = BASE_MMR - BASE_LEAGUE_INDEX * MMR_PER_DIVISION * DIVISIONS_PER_LEAGUE
const MMR_TO_LP = LP_PER_DIVISION / MMR_PER_DIVISION

const PLACEMENT_MATCHES_REQUIRED = 5

const MIN_K_FACTOR = 38
const K_DECAY_FACTOR = 0.1

/** Fresh-player defaults (the live values live in Firestore rating config). */
export const INITIAL_MMR = BASE_MMR
export const INITIAL_K_FACTOR = 80
/** LP awarded per MMR point (used to present a plausible per-match LP gain). */
export const MMR_LP_RATIO = MMR_TO_LP
export { PLACEMENT_MATCHES_REQUIRED }

/**
 * Applies the raw-MMR Elo update to both players in place, returning each
 * player's MMR delta. Rank is then derived from MMR via {@link rankFromMmr} —
 * the same path the server uses for imported users — which spreads ranks across
 * the whole ladder instead of crawling up the LP system from the placement cap.
 */
export function updateMmrOnly(a: RatingFields, b: RatingFields, scoreA: number): [number, number] {
  const beforeA = a.mmr_score
  const beforeB = b.mmr_score
  updateMMRs(a, b, scoreA)
  return [a.mmr_score - beforeA, b.mmr_score - beforeB]
}

/** Rank straight from MMR (provisional until placements are done). */
export function rankFromMmr(
  mmr: number,
  matches: number
): { league: League | null; division: number | null; lp: number | null } {
  if (matches < PLACEMENT_MATCHES_REQUIRED) return { league: null, division: null, lp: null }
  const { league, division, lp } = mmrToRank(mmr)
  return { league, division, lp }
}

/** Logistic expected score of A against B (standard Elo, 400-point scale). */
export function getExpectedResult(mmrA: number, mmrB: number): number {
  return 1 / (1 + 10 ** ((mmrB - mmrA) / 400))
}

/** Maps a raw MMR onto a league / division / LP, mirroring RatingService. */
export function mmrToRank(mmr: number): Rank {
  const lpAboveFloor = (mmr - BRONZE_4_MMR) / (MMR_PER_DIVISION / LP_PER_DIVISION)
  const totalLp = Math.max(0, lpAboveFloor)

  const leagueIndex = Math.min(
    Math.floor(totalLp / (LP_PER_DIVISION * DIVISIONS_PER_LEAGUE)),
    LEAGUES.length - 1
  )
  const league = LEAGUES[leagueIndex] as League
  const lpInLeague = totalLp - leagueIndex * LP_PER_DIVISION * DIVISIONS_PER_LEAGUE

  if (APEX_LEAGUES.has(league)) {
    return { league, division: null, lp: Math.floor(lpInLeague) }
  }

  const divisionsAboveFloor = Math.floor(lpInLeague / LP_PER_DIVISION)
  const division = DIVISIONS_PER_LEAGUE - divisionsAboveFloor
  const lp = Math.floor(lpInLeague - divisionsAboveFloor * LP_PER_DIVISION)
  return { league, division, lp }
}

function updateMMRs(a: RatingFields, b: RatingFields, scoreA: number): void {
  const scoreB = 1 - scoreA
  const expectedA = getExpectedResult(a.mmr_score, b.mmr_score)
  const expectedB = 1 - expectedA
  updateMMR(a, scoreA - expectedA)
  updateMMR(b, scoreB - expectedB)
}

function updateMMR(rating: RatingFields, surpriseFactor: number): void {
  rating.mmr_score += rating.mmr_k_factor * surpriseFactor
  rating.mmr_k_factor = decayKFactor(rating.mmr_k_factor)
}

function decayKFactor(k: number): number {
  return k * (1 - K_DECAY_FACTOR) + MIN_K_FACTOR * K_DECAY_FACTOR
}
