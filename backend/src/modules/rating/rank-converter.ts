import { ClientRank, Division, League } from '@magic3t/common-types'
import { RatingConfigDocument, UserApexFlag } from '@magic3t/database-types'
import { clamp } from 'lodash'

const BASE_APEX_POINTS = 400 * 4
const MIN_CHALLENGER_POINTS = BASE_APEX_POINTS + 100

const LEAGUE_INDEXES = [
  League.Bronze, // 0
  League.Silver, // 1
  League.Gold, // 2
  League.Diamond, //3
  League.Master, //4
]

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
    const lPAboveLowest = 400 * leaguesAboveLowest
    return Math.floor(lPAboveLowest)
  }

  getRankFromElo(
    eloScore: number,
    rankedCount: number | null,
    apexFlag: UserApexFlag | null
  ): ClientRank {
    const totalLP = this.getTotalLP(eloScore)
    return this.getRankFromTotalLP(totalLP, rankedCount, apexFlag)
  }

  /** Gets the client rank based on total points. All apex tiers are considered as master. */
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

    const leagueIndex = clamp(Math.floor(totalLP / 400), 0, 4)
    const league = LEAGUE_INDEXES[leagueIndex]

    // If the user is in master league, we need to check their apex flag
    if (league === League.Master) {
      return {
        league: apexFlag === 'challenger' ? League.Challenger : League.Master,
        division: null,
        points: totalLP - BASE_APEX_POINTS,
        rankedCount: rankedCount ?? 0,
      }
    }

    const pointsSinceDivision4 = totalLP % 400
    const division = (4 - Math.floor(pointsSinceDivision4 / 100)) as Division
    const points = pointsSinceDivision4 % 100

    return {
      league,
      division,
      points,
      rankedCount: rankedCount ?? 0,
    }
  }

  isChallengerEllegible(eloScore: number): boolean {
    const totalPoints = this.getTotalLP(eloScore)
    return totalPoints >= MIN_CHALLENGER_POINTS
  }

  expectedScore(eloA: number, eloB: number): number {
    const expectedScoreA = 1 / (1 + 10 ** ((eloB - eloA) / 400))
    return expectedScoreA
  }

  updateRatings([a, b]: [RatingState, RatingState], scoreOfA: number): [RatingState, RatingState] {
    const { k_deflation_factor, least_k_factor } = this.config

    const expectedScoreA = this.expectedScore(a.elo, b.elo)
    const expectedScoreB = 1 - expectedScoreA

    const newEloA = a.elo + a.kFactor * (scoreOfA - expectedScoreA)
    const newEloB = b.elo + b.kFactor * (1 - scoreOfA - expectedScoreB)

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
            ? this.isChallengerEllegible(newEloA)
              ? 'challenger'
              : null
            : a.apexFlag,
      },
      {
        elo: newEloB,
        kFactor: newKFactorB,
        rankedCount: b.rankedCount + 1,
        apexFlag:
          b.apexFlag === 'challenger'
            ? this.isChallengerEllegible(newEloB)
              ? 'challenger'
              : null
            : b.apexFlag,
      },
    ]
  }
}
