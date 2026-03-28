import { ClientRank, Division, League } from '@magic3t/common-types'
import { RatingConfigDocument, UserApexFlag } from '@magic3t/database-types'
import { clamp } from 'lodash'

const LP_PER_LEAGUE = 400
const LP_PER_DIVISION = 100
const DIVISIONS_PER_LEAGUE = 4

const LEAGUES_BY_INDEX = [League.Bronze, League.Silver, League.Gold, League.Diamond, League.Master]

const MASTER_LEAGUE_INDEX = LEAGUES_BY_INDEX.indexOf(League.Master)
const BASE_APEX_POINTS = LP_PER_LEAGUE * MASTER_LEAGUE_INDEX
const MIN_CHALLENGER_POINTS = BASE_APEX_POINTS + LP_PER_DIVISION

export type RatingState = {
  elo: number
  kFactor: number
  rankedCount: number
  apexFlag: UserApexFlag | null
}

export class RankConverter {
  constructor(public readonly config: RatingConfigDocument) {}

  getTotalLP(eloScore: number): number {
    const { initial_elo, elo_per_league, initial_league_index } = this.config

    const eloAboveInitial = eloScore - initial_elo
    const leaguesAboveInitial = eloAboveInitial / elo_per_league
    const leaguesAboveLowest = leaguesAboveInitial + initial_league_index
    const lpAboveLowest = LP_PER_LEAGUE * leaguesAboveLowest
    return Math.floor(lpAboveLowest)
  }

  getRankFromElo(
    eloScore: number,
    rankedCount: number | null,
    apexFlag: UserApexFlag | null
  ): ClientRank {
    const totalLP = this.getTotalLP(eloScore)
    return this.getRankFromTotalLP(totalLP, rankedCount, apexFlag)
  }

  relativeLpToElo(lp: number): number {
    return (lp / LP_PER_LEAGUE) * this.config.elo_per_league
  }

  /** Gets the client rank based on total league points, accounting for provisional status and apex tiers (Challenger/Grandmaster). */
  getRankFromTotalLP(
    totalLP: number,
    rankedCount: number | null,
    apexFlag: UserApexFlag | null
  ): ClientRank {
    // If the user hasn't played enough ranked games, they are considered provisional regardless of their elo score
    if (rankedCount !== null && rankedCount < this.config.min_ranked_count) {
      return {
        league: League.Provisional,
        division: null,
        points: null,
        rankedCount,
      }
    }

    const leagueIndex = clamp(Math.floor(totalLP / LP_PER_LEAGUE), 0, MASTER_LEAGUE_INDEX)
    const league = LEAGUES_BY_INDEX[leagueIndex]

    // If the user is in master league, we need to check their apex flag
    if (league === League.Master) {
      return {
        league: apexFlag === 'challenger' ? League.Challenger : League.Master,
        division: null,
        points: totalLP - BASE_APEX_POINTS,
        rankedCount: rankedCount ?? 0,
      }
    }

    const lpWithinLeague = totalLP % LP_PER_LEAGUE
    const division = (DIVISIONS_PER_LEAGUE -
      Math.floor(lpWithinLeague / LP_PER_DIVISION)) as Division
    const points = lpWithinLeague % LP_PER_DIVISION

    return {
      league,
      division,
      points,
      rankedCount: rankedCount ?? 0,
    }
  }

  isChallengerEligible(eloScore: number): boolean {
    const totalPoints = this.getTotalLP(eloScore)
    return totalPoints >= MIN_CHALLENGER_POINTS
  }

  expectedScore(eloA: number, eloB: number): number {
    return 1 / (1 + 10 ** ((eloB - eloA) / 400))
  }

  updateRatings([a, b]: [RatingState, RatingState], scoreOfA: number): [RatingState, RatingState] {
    const { k_deflation_factor, least_k_factor } = this.config

    const expectedScoreA = this.expectedScore(a.elo, b.elo)
    const expectedScoreB = 1 - expectedScoreA

    const scoreOfB = 1 - scoreOfA
    const newEloA = a.elo + a.kFactor * (scoreOfA - expectedScoreA)
    const newEloB = b.elo + b.kFactor * (scoreOfB - expectedScoreB)

    // TODO: rename to min k factor and k factor decay
    const newKFactorA = a.kFactor * (1 - k_deflation_factor) + least_k_factor * k_deflation_factor
    const newKFactorB = b.kFactor * (1 - k_deflation_factor) + least_k_factor * k_deflation_factor

    return [
      {
        elo: newEloA,
        kFactor: newKFactorA,
        rankedCount: a.rankedCount + 1,
        apexFlag:
          a.apexFlag === 'challenger'
            ? this.isChallengerEligible(newEloA)
              ? 'challenger'
              : null
            : a.apexFlag, // grandmaster is persistent — no eligibility check is applied
      },
      {
        elo: newEloB,
        kFactor: newKFactorB,
        rankedCount: b.rankedCount + 1,
        apexFlag:
          b.apexFlag === 'challenger'
            ? this.isChallengerEligible(newEloB)
              ? 'challenger'
              : null
            : b.apexFlag, // grandmaster is persistent — no eligibility check is applied
      },
    ]
  }
}
