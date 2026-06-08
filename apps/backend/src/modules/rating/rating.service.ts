import { LeagueEnum } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { unexpected } from '@/common'

const LEAGUES: LeagueEnum[] = ['bronze', 'silver', 'gold', 'diamond', 'master', 'challenger']
const APEX_LEAGUES = new Set<LeagueEnum>(['master', 'challenger'])

const BASE_MMR = 1500
const BASE_LEAGUE_INDEX = LEAGUES.indexOf('silver')

const MMR_PER_DIVISION = 50
const LP_PER_DIVISION = 100
const DIVISIONS_PER_LEAGUE = 4

const BRONZE_4_MMR = BASE_MMR - BASE_LEAGUE_INDEX * MMR_PER_DIVISION * DIVISIONS_PER_LEAGUE
const MMR_TO_LP = LP_PER_DIVISION / MMR_PER_DIVISION

const PLACEMENT_MATCHES_REQUIRED = 5

const PLACEMENT_MAX_LEAGUE: LeagueEnum = 'gold'
const PLACEMENT_MAX_DIVISION = 1
const PLACEMENT_MAX_LP = 0

const MIN_K_FACTOR = 38
const K_DECAY_FACTOR = 0.1

export type UserRatingFields = {
  mmr_score: number
  mmr_k_factor: number
  rank_league: LeagueEnum | null
  rank_division: number | null
  rank_lp: number | null
  rank_matches: number
  rank_date: Date
}

type Rank = { league: LeagueEnum; division: number | null; lp: number }

@Injectable()
export class RatingService {
  computeMatchResult(
    a: UserRatingFields,
    b: UserRatingFields,
    scoreA: number
  ): { results: [UserRatingFields, UserRatingFields]; lpGains: [number | null, number | null] } {
    const newA = { ...a }
    const newB = { ...b }

    const lpGains = this.updateLeagues(newA, newB, scoreA)
    this.updateMMRs(newA, newB, scoreA)

    return { results: [newA, newB], lpGains }
  }

  getRankFromLegacyMmr(
    mmrScore: number,
    matches: number
  ): { rank_league: LeagueEnum | null; rank_division: number | null; rank_lp: number | null } {
    if (matches < PLACEMENT_MATCHES_REQUIRED) {
      return { rank_league: null, rank_division: null, rank_lp: null }
    }
    const { league, division, lp } = this.mmrToRank(mmrScore)
    return { rank_league: league, rank_division: division, rank_lp: lp }
  }

  private updateLeagues(
    a: UserRatingFields,
    b: UserRatingFields,
    scoreA: number
  ): [number | null, number | null] {
    const lpGainA = this.updatePlayerLeague(a, b.mmr_score, scoreA)
    const lpGainB = this.updatePlayerLeague(b, a.mmr_score, 1 - scoreA)
    return [lpGainA, lpGainB]
  }

  private updatePlayerLeague(
    player: UserRatingFields,
    opponentMmr: number,
    score: number
  ): number | null {
    player.rank_matches++
    player.rank_date = new Date()

    if (player.rank_league === null) {
      if (player.rank_matches >= PLACEMENT_MATCHES_REQUIRED) {
        const rank = this.capPlacementRank(this.mmrToRank(player.mmr_score))
        player.rank_league = rank.league
        player.rank_division = rank.division
        player.rank_lp = rank.lp
      }
      return null
    }

    const currentLp = player.rank_lp as number
    const expectedMmr = this.getExpectedMmr({
      league: player.rank_league,
      division: player.rank_division,
      lp: currentLp,
    })
    const expected = this.getExpectedResult(expectedMmr, opponentMmr)
    const eloChange = player.mmr_k_factor * (score - expected)
    const lpDelta = Math.round(eloChange * MMR_TO_LP)
    this.applyLpChange(player, lpDelta)
    return lpDelta
  }

  private updateMMRs(a: UserRatingFields, b: UserRatingFields, scoreA: number): void {
    const scoreB = 1 - scoreA
    const expectedA = this.getExpectedResult(a.mmr_score, b.mmr_score)
    const expectedB = 1 - expectedA

    this.updateMMR(a, scoreA - expectedA)
    this.updateMMR(b, scoreB - expectedB)
  }

  private updateMMR(rating: UserRatingFields, surpriseFactor: number): void {
    rating.mmr_score += rating.mmr_k_factor * surpriseFactor
    rating.mmr_k_factor = this.decayKFactor(rating.mmr_k_factor)
  }

  private getExpectedResult(mmrA: number, mmrB: number): number {
    return 1 / (1 + 10 ** ((mmrB - mmrA) / 400))
  }

  private getExpectedMmr(rank: Rank): number {
    const leagueIndex = LEAGUES.indexOf(rank.league)
    if (leagueIndex === -1) unexpected(`Unknown league: ${rank.league}`)

    const leagueFloorMmr = BRONZE_4_MMR + leagueIndex * MMR_PER_DIVISION * DIVISIONS_PER_LEAGUE

    if (APEX_LEAGUES.has(rank.league)) {
      return leagueFloorMmr + rank.lp * (MMR_PER_DIVISION / LP_PER_DIVISION)
    }

    const divisionsAboveFloor = DIVISIONS_PER_LEAGUE - (rank.division as number)
    return (
      leagueFloorMmr +
      divisionsAboveFloor * MMR_PER_DIVISION +
      rank.lp * (MMR_PER_DIVISION / LP_PER_DIVISION)
    )
  }

  mmrToRank(mmr: number): Rank {
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
      return {
        league: PLACEMENT_MAX_LEAGUE,
        division: PLACEMENT_MAX_DIVISION,
        lp: PLACEMENT_MAX_LP,
      }
    }
    if (currentLeagueIndex === maxLeagueIndex) {
      const rankDivision = rank.division as number
      const isAboveCap =
        rankDivision < PLACEMENT_MAX_DIVISION ||
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

  private applyLpChange(player: UserRatingFields, lpDelta: number): void {
    const startLeague = player.rank_league as LeagueEnum

    if (APEX_LEAGUES.has(startLeague)) {
      const currentLp = player.rank_lp as number
      player.rank_lp = Math.max(0, currentLp + lpDelta)
      return
    }

    let runLeague = startLeague
    let runDivision = player.rank_division as number
    let newLp = (player.rank_lp as number) + lpDelta

    while (newLp >= LP_PER_DIVISION) {
      newLp -= LP_PER_DIVISION
      if (runDivision > 1) {
        runDivision--
        continue
      }
      const nextLeagueIndex = LEAGUES.indexOf(runLeague) + 1
      if (nextLeagueIndex >= LEAGUES.length) {
        newLp = LP_PER_DIVISION - 1
        break
      }
      runLeague = LEAGUES[nextLeagueIndex]
      if (APEX_LEAGUES.has(runLeague)) {
        player.rank_league = runLeague
        player.rank_division = null
        player.rank_lp = newLp
        return
      }
      runDivision = DIVISIONS_PER_LEAGUE
    }

    while (newLp < 0) {
      if (runDivision < DIVISIONS_PER_LEAGUE) {
        runDivision++
        newLp += LP_PER_DIVISION
        continue
      }
      const prevLeagueIndex = LEAGUES.indexOf(runLeague) - 1
      if (prevLeagueIndex < 0) {
        newLp = 0
        break
      }
      runLeague = LEAGUES[prevLeagueIndex]
      runDivision = 1
      newLp += LP_PER_DIVISION
    }

    player.rank_league = runLeague
    player.rank_division = runDivision
    player.rank_lp = newLp
  }

  private decayKFactor(k: number): number {
    return k * (1 - K_DECAY_FACTOR) + MIN_K_FACTOR * K_DECAY_FACTOR
  }
}
