import { ClientRank, Division, League } from '@magic3t/common-types'
import { RatingConfigRow, UserDocumentElo } from '@magic3t/database-types'
import { clamp } from 'lodash'

const baseLeagueIndexes = [League.Bronze, League.Silver, League.Gold, League.Diamond]
const TOTAL_MASTER_LP = 4 * 400

/** Represents a user rating. @deprecated */
export class RatingConverter {
  public eloRow: UserDocumentElo

  constructor(
    elo: Readonly<UserDocumentElo>,
    private config: Readonly<RatingConfigRow>
  ) {
    this.eloRow = { ...elo }
  }

  /** Gets the initial progress of the user towards being ranked. */
  public get bo5Progress(): number {
    return this.eloRow.matches > 5 ? 100 : (this.eloRow.matches / 5) * 100
  }

  /** Indicates if the user is still in the provisional (unranked) state. */
  public get provisional(): boolean {
    return this.bo5Progress < 100
  }

  /** Gets how much League Points the user has in total, since the lowest league. */
  public get totalPoints(): number | null {
    if (this.provisional) return null
    const eloAboveBase = this.eloRow.score - this.config.initial_elo
    const leaguesAboveBase = eloAboveBase / this.config.elo_per_league
    const leaguesAboveLowest = leaguesAboveBase + this.config.initial_league_index
    const lPAboveLowest = 400 * leaguesAboveLowest
    return Math.floor(lPAboveLowest)
  }

  /**
   * Gets how much League Points the user has in their current league+division.
   *
   * Returns an integer value, or null if the user is provisional.
   */
  public get leaguePoints(): number | null {
    const totalPoints = this.totalPoints
    if (totalPoints === null) return null

    if (totalPoints >= TOTAL_MASTER_LP) {
      return totalPoints - TOTAL_MASTER_LP
    }
    const divisionPoints = totalPoints % 100
    return divisionPoints
  }

  public get division(): Division | null {
    const totalPoints = this.totalPoints
    if (totalPoints === null) return null
    if (totalPoints >= TOTAL_MASTER_LP) return null
    const pointsAboveDiv4 = totalPoints % 400
    const divsAbove4 = Math.floor(pointsAboveDiv4 / 100)
    return (4 - divsAbove4) as Division
  }

  public get league(): League {
    const totalPoints = this.totalPoints
    if (totalPoints === null) return League.Provisional
    if (totalPoints >= TOTAL_MASTER_LP) {
      if (this.eloRow.challenger) return League.Challenger
      return League.Master
    }

    const leagueIndex = clamp(Math.floor(totalPoints / 400), 0, 4)
    return baseLeagueIndexes[leagueIndex]
  }

  /** Gets the expected score of this user against an opponent. */
  public expectedScore(opponent: RatingConverter): number {
    const ratingDiff = opponent.eloRow.score - this.eloRow.score
    return 1 / (1 + 10 ** (ratingDiff / 400))
  }

  /** Updates the K-factor after a match */
  public updateKFactor(): void {
    if (this.eloRow.k - this.config.least_k_factor < 0.5) {
      this.eloRow.k = this.config.least_k_factor
    }

    this.eloRow.k =
      this.config.least_k_factor * this.config.k_deflation_factor +
      this.eloRow.k * (1 - this.config.k_deflation_factor)
  }

  /**
   * Gets the difference in League Points (LP) between this rating and another.
   *
   * If either rating has null LP, returns 0.
   */
  public getLpGapAgainst(other: RatingConverter): number | 0 {
    const myLp = this.totalPoints
    const otherLp = other.totalPoints

    if (myLp === null || otherLp === null) return 0
    return myLp - otherLp
  }

  /**
   * Updates the ratings of two users based on a match result.
   * @returns The LP gains for both users.
   */
  public updateRatings(opponent: RatingConverter, score: number): [number, number] {
    const [thisPreviousLp, opponentPreviousLp] = [this.totalPoints, opponent.totalPoints]
    const expectedScoreSelf = this.expectedScore(opponent)
    const surpriseFactor = score - expectedScoreSelf // Defines how surprised the system is about the result

    // Update K-factors
    this.updateKFactor()
    opponent.updateKFactor()

    // Update match counters
    this.eloRow.matches += 1
    opponent.eloRow.matches += 1

    // Update scores
    this.eloRow.score += surpriseFactor * this.eloRow.k
    opponent.eloRow.score -= surpriseFactor * opponent.eloRow.k

    const [thisNewTotalPoints, opponentNewTotalPoints] = [this.totalPoints, opponent.totalPoints]

    // Get the LP gains
    const thisLpGain =
      thisNewTotalPoints !== null && thisPreviousLp !== null
        ? thisNewTotalPoints - thisPreviousLp
        : 0
    const opponentLpGain =
      opponentNewTotalPoints !== null && opponentPreviousLp !== null
        ? opponentNewTotalPoints - opponentPreviousLp
        : 0

    // Remove challenger status if falling below master
    if (this.eloRow.challenger && thisNewTotalPoints && thisNewTotalPoints < TOTAL_MASTER_LP) {
      this.eloRow.challenger = false
    }
    if (
      opponent.eloRow.challenger &&
      opponentNewTotalPoints &&
      opponentNewTotalPoints < TOTAL_MASTER_LP
    ) {
      opponent.eloRow.challenger = false
    }

    return [thisLpGain, opponentLpGain]
  }

  /** Checks if the user is eligible to be a challenger (has enough LP above Master). */
  public get isChallengerEligible(): boolean {
    const totalLp = this.totalPoints
    if (totalLp === null) return false

    return totalLp >= TOTAL_MASTER_LP + 100
  }

  /** Gets the rating data (league, division, points, progress). */
  // TODO: Optimize it to not repeat getTotalLP calculations
  public get ratingData(): ClientRank {
    return {
      league: this.league,
      division: this.division,
      points: this.leaguePoints,
      progress: this.bo5Progress,
    }
  }
}
