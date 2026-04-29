import { LeagueEnum, UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { unexpected } from '@/common'

const LEAGUES: LeagueEnum[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'challenger',
]
const APEX_LEAGUES = new Set<LeagueEnum>(['master', 'challenger'])

// MMR at BASE_LEAGUE (silver), division 4, 0 LP — change here to shift the entire curve
const BASE_MMR = 1500
const BASE_LEAGUE_INDEX = LEAGUES.indexOf('silver')

// MMR change per division; also defines LP-to-MMR ratio (LP_PER_DIVISION LP = MMR_PER_DIVISION MMR)
const MMR_PER_DIVISION = 50
const LP_PER_DIVISION = 100
const DIVISIONS_PER_LEAGUE = 4

// MMR at the absolute floor (Bronze 4, 0 LP)
const BRONZE_4_MMR = BASE_MMR - BASE_LEAGUE_INDEX * MMR_PER_DIVISION * DIVISIONS_PER_LEAGUE

// How many LP one MMR point is worth (= LP_PER_DIVISION / MMR_PER_DIVISION = 2)
const MMR_TO_LP = LP_PER_DIVISION / MMR_PER_DIVISION

// Placement series: number of matches required before a rank is assigned
const PLACEMENT_MATCHES_REQUIRED = 5

// Highest rank assignable after placements (Gold 1 @ 0 LP)
const PLACEMENT_MAX_LEAGUE: LeagueEnum = 'gold'
const PLACEMENT_MAX_DIVISION = 1
const PLACEMENT_MAX_LP = 0

// K-factor decay: converges exponentially toward MIN_K_FACTOR
const MIN_K_FACTOR = 38
const K_DECAY_FACTOR = 0.1

type UserRankFields = Pick<UserRow, keyof UserRow & `rank_${string}`>
type UserMmrFields = Pick<UserRow, keyof UserRow & `mmr_${string}`>
type UserRatingFields = UserRankFields & UserMmrFields

type Rank = { league: LeagueEnum; division: number | null; lp: number }

@Injectable()
export class RatingService {
  computeMatchResult(
    a: UserRatingFields,
    b: UserRatingFields,
    scoreA: number
  ): [UserRatingFields, UserRatingFields] {
    const newA = { ...a }
    const newB = { ...b }

    this.updateLeagues(newA, newB, scoreA)
    this.updateMMRs(newA, newB, scoreA)

    return [newA, newB]
  }

  private updateLeagues(a: UserRatingFields, b: UserRatingFields, scoreA: number): void {
    this.updatePlayerLeague(a, b.mmr_score, scoreA)
    this.updatePlayerLeague(b, a.mmr_score, 1 - scoreA)
  }

  private updatePlayerLeague(
    player: UserRatingFields,
    opponentMmr: number,
    score: number
  ): void {
    player.rank_matches++
    player.rank_date = new Date()

    if (player.rank_league === null) {
      if (player.rank_matches >= PLACEMENT_MATCHES_REQUIRED) {
        const rank = this.capPlacementRank(this.mmrToRank(player.mmr_score))
        player.rank_league = rank.league
        player.rank_division = rank.division
        player.rank_lp = rank.lp
      }
      return
    }

    // Compare rank's expected MMR against opponent's real MMR to decide LP gain/loss
    const expectedMmr = this.getExpectedMmr({
      league: player.rank_league,
      division: player.rank_division,
      lp: player.rank_lp!,
    })
    const expected = this.getExpectedResult(expectedMmr, opponentMmr)
    const eloChange = player.mmr_k_factor * (score - expected)
    this.applyLpChange(player, eloChange * MMR_TO_LP)
  }

  private updateMMRs(a: UserMmrFields, b: UserMmrFields, scoreA: number): void {
    const scoreB = 1 - scoreA
    const expectedA = this.getExpectedResult(a.mmr_score, b.mmr_score)
    const expectedB = 1 - expectedA

    this.updateMMR(a, scoreA - expectedA)
    this.updateMMR(b, scoreB - expectedB)
  }

  private updateMMR(rating: UserMmrFields, surpriseFactor: number): void {
    rating.mmr_score += rating.mmr_k_factor * surpriseFactor
    rating.mmr_k_factor = this.decayKFactor(rating.mmr_k_factor)
  }

  private getExpectedResult(mmrA: number, mmrB: number): number {
    return 1 / (1 + 10 ** ((mmrB - mmrA) / 400))
  }

  // Expected MMR for a rank position. `lp` is LP within the division (0-99) for non-apex,
  // and cumulative LP above the apex floor for apex leagues (where division is null).
  private getExpectedMmr(rank: Rank): number {
    const leagueIndex = LEAGUES.indexOf(rank.league)
    if (leagueIndex === -1) unexpected(`Unknown league: ${rank.league}`)

    const leagueFloorMmr = BRONZE_4_MMR + leagueIndex * MMR_PER_DIVISION * DIVISIONS_PER_LEAGUE

    if (APEX_LEAGUES.has(rank.league)) {
      return leagueFloorMmr + rank.lp * (MMR_PER_DIVISION / LP_PER_DIVISION)
    }

    const divisionsAboveFloor = DIVISIONS_PER_LEAGUE - rank.division!
    return (
      leagueFloorMmr +
      divisionsAboveFloor * MMR_PER_DIVISION +
      rank.lp * (MMR_PER_DIVISION / LP_PER_DIVISION)
    )
  }

  // Derives a rank from a raw MMR value.
  private mmrToRank(mmr: number): Rank {
    const lpAboveFloor = (mmr - BRONZE_4_MMR) / (MMR_PER_DIVISION / LP_PER_DIVISION)
    const totalLp = Math.max(0, lpAboveFloor)

    const leagueIndex = Math.min(
      Math.floor(totalLp / (LP_PER_DIVISION * DIVISIONS_PER_LEAGUE)),
      LEAGUES.length - 1
    )
    const league = LEAGUES[leagueIndex]
    const lpInLeague = totalLp - leagueIndex * LP_PER_DIVISION * DIVISIONS_PER_LEAGUE

    if (APEX_LEAGUES.has(league)) {
      return { league, division: null, lp: Math.floor(lpInLeague) }
    }

    const divisionsAboveFloor = Math.floor(lpInLeague / LP_PER_DIVISION)
    const division = DIVISIONS_PER_LEAGUE - divisionsAboveFloor
    const lp = Math.floor(lpInLeague - divisionsAboveFloor * LP_PER_DIVISION)

    return { league, division, lp }
  }

  private capPlacementRank(rank: Rank): Rank {
    const maxLeagueIndex = LEAGUES.indexOf(PLACEMENT_MAX_LEAGUE)
    const currentLeagueIndex = LEAGUES.indexOf(rank.league)

    if (currentLeagueIndex > maxLeagueIndex) {
      return { league: PLACEMENT_MAX_LEAGUE, division: PLACEMENT_MAX_DIVISION, lp: PLACEMENT_MAX_LP }
    }
    if (currentLeagueIndex === maxLeagueIndex) {
      const isAboveCap =
        rank.division! < PLACEMENT_MAX_DIVISION ||
        (rank.division === PLACEMENT_MAX_DIVISION && rank.lp > PLACEMENT_MAX_LP)
      if (isAboveCap) {
        return {
          league: PLACEMENT_MAX_LEAGUE,
          division: PLACEMENT_MAX_DIVISION,
          lp: PLACEMENT_MAX_LP,
        }
      }
    }
    return rank
  }

  private applyLpChange(player: UserRankFields, lpDelta: number): void {
    const roundedDelta = Math.round(lpDelta)
    let league = player.rank_league!

    if (APEX_LEAGUES.has(league)) {
      player.rank_lp = Math.max(0, player.rank_lp! + roundedDelta)
      return
    }

    let division = player.rank_division!
    let newLp = player.rank_lp! + roundedDelta

    // Promotions: cross division/league boundaries upward
    while (newLp >= LP_PER_DIVISION) {
      newLp -= LP_PER_DIVISION
      if (division > 1) {
        division--
        continue
      }
      // Division 1 overflow → promote to next league
      const nextLeagueIndex = LEAGUES.indexOf(league) + 1
      if (nextLeagueIndex >= LEAGUES.length) {
        newLp = LP_PER_DIVISION - 1
        break
      }
      league = LEAGUES[nextLeagueIndex]
      if (APEX_LEAGUES.has(league)) {
        // Entering apex: no divisions, LP carries over
        player.rank_league = league
        player.rank_division = null
        player.rank_lp = newLp
        return
      }
      division = DIVISIONS_PER_LEAGUE
    }

    // Demotions: cross division/league boundaries downward
    while (newLp < 0) {
      if (division < DIVISIONS_PER_LEAGUE) {
        division++
        newLp += LP_PER_DIVISION
        continue
      }
      // Division 4 underflow → demote to previous league
      const prevLeagueIndex = LEAGUES.indexOf(league) - 1
      if (prevLeagueIndex < 0) {
        newLp = 0
        break
      }
      league = LEAGUES[prevLeagueIndex]
      division = 1
      newLp += LP_PER_DIVISION
    }

    player.rank_league = league
    player.rank_division = division
    player.rank_lp = newLp
  }

  private decayKFactor(k: number): number {
    return k * (1 - K_DECAY_FACTOR) + MIN_K_FACTOR * K_DECAY_FACTOR
  }
}
