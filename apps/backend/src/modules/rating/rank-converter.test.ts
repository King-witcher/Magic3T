import { faker } from '@faker-js/faker'
import { League } from '@magic3t/common-types'
import type { RatingConfigDocument } from '@magic3t/database-types'
import { RankConverter, RatingState } from './rank-converter'

// ─── Constants (mirror module-level constants from rank-converter.ts) ─────────

const LP_PER_LEAGUE = 400
/** Total LP required for challenger eligibility (BASE_APEX_POINTS + LP_PER_DIVISION). */
const MIN_CHALLENGER_LP = LP_PER_LEAGUE * 4 + 100 // 1700

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the exact elo that maps to a given totalLP (inverse of getTotalLP, without flooring). */
function eloForLP(lp: number, config: RatingConfigDocument): number {
  return (
    config.initial_elo + config.elo_per_league * (lp / LP_PER_LEAGUE - config.initial_league_index)
  )
}

// ─── Factories ────────────────────────────────────────────────────────────────

function createConfig(overrides: Partial<RatingConfigDocument> = {}): RatingConfigDocument {
  return {
    // elo_per_league is constrained to multiples of 4 so that LP values that are
    // multiples of 100 map to exact float elos, avoiding Math.floor precision issues.
    initial_elo: faker.number.int({ min: 1000, max: 2000 }),
    elo_per_league: faker.number.int({ min: 5, max: 50 }) * 4,
    initial_league_index: faker.number.int({ min: 0, max: 3 }),
    least_k_factor: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
    initial_k_factor: faker.number.float({ min: 30, max: 50, fractionDigits: 1 }),
    k_deflation_factor: faker.number.float({ min: 0.05, max: 0.2, fractionDigits: 2 }),
    min_ranked_count: faker.number.int({ min: 5, max: 20 }),
    ...overrides,
  }
}

function createConverter(overrides?: Partial<RatingConfigDocument>): RankConverter {
  return new RankConverter(createConfig(overrides))
}

function createPlayer(overrides: Partial<RatingState> = {}): RatingState {
  return {
    elo: faker.number.float({ min: 1000, max: 2000 }),
    kFactor: faker.number.float({ min: 10, max: 40 }),
    rankedCount: faker.number.int({ min: 10, max: 100 }),
    apexFlag: null,
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe(RankConverter, () => {
  describe('getTotalLP', () => {
    it('returns LP corresponding to initial_league_index at initial_elo', () => {
      const converter = createConverter()
      const { initial_elo, initial_league_index } = converter.config
      expect(converter.getTotalLP(initial_elo)).toBe(LP_PER_LEAGUE * initial_league_index)
    })

    it('returns a higher LP for a higher elo', () => {
      const converter = createConverter()
      const baseElo = faker.number.float({ min: 1000, max: 1800 })
      const higherElo = baseElo + faker.number.float({ min: 1, max: 200 })
      expect(converter.getTotalLP(higherElo)).toBeGreaterThan(converter.getTotalLP(baseElo))
    })

    it('floors fractional LP', () => {
      const converter = createConverter()
      const { initial_elo, elo_per_league, initial_league_index } = converter.config
      // Adding elo_per_league/3 produces 400/3 ≈ 133.33 LP above the league offset,
      // verifying the result is floored rather than rounded or left as a float.
      const elo = initial_elo + elo_per_league / 3
      const rawLP =
        (LP_PER_LEAGUE * (elo - initial_elo)) / elo_per_league +
        LP_PER_LEAGUE * initial_league_index
      expect(converter.getTotalLP(elo)).toBe(Math.floor(rawLP))
      expect(converter.getTotalLP(elo)).toBeLessThan(rawLP)
    })

    it('respects initial_league_index configuration', () => {
      const converter = createConverter({ initial_league_index: 0 })
      // At initial_elo with initial_league_index=0: LP_PER_LEAGUE × 0 = 0
      expect(converter.getTotalLP(converter.config.initial_elo)).toBe(0)
    })

    it('respects elo_per_league configuration', () => {
      // elo_per_league=LP_PER_LEAGUE → 1 elo = 1 LP → getTotalLP(initial_elo + n) = n for integer n
      const converter = createConverter({ elo_per_league: LP_PER_LEAGUE, initial_league_index: 0 })
      const eloDelta = faker.number.int({ min: 1, max: LP_PER_LEAGUE })
      expect(converter.getTotalLP(converter.config.initial_elo + eloDelta)).toBe(eloDelta)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('relativeLpToElo', () => {
    it('returns 0 for 0 LP', () => {
      const converter = createConverter()
      expect(converter.relativeLpToElo(0)).toBe(0)
    })

    it('returns exactly elo_per_league for a full league of LP (LP_PER_LEAGUE)', () => {
      const converter = createConverter()
      // LP_PER_LEAGUE LP / LP_PER_LEAGUE × elo_per_league = elo_per_league
      expect(converter.relativeLpToElo(LP_PER_LEAGUE)).toBe(converter.config.elo_per_league)
    })

    it('is the inverse of getTotalLP for LP deltas (with initial_league_index=0)', () => {
      // elo_per_league=400 makes the LP↔elo ratio exactly 1:1, avoiding floating-point drift
      const converter = createConverter({ initial_league_index: 0, elo_per_league: 400 })
      const lpDelta = faker.number.int({ min: 1, max: 800 })
      const eloEquivalent = converter.relativeLpToElo(lpDelta)
      expect(converter.getTotalLP(converter.config.initial_elo + eloEquivalent)).toBe(lpDelta)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('getRankFromTotalLP', () => {
    describe('provisional status', () => {
      it('returns Provisional when rankedCount is below the minimum', () => {
        const converter = createConverter()
        const rankedCount = faker.number.int({ min: 0, max: converter.config.min_ranked_count - 1 })
        const rank = converter.getRankFromTotalLP(
          faker.number.int({ min: 0, max: 1200 }),
          rankedCount,
          null
        )

        expect(rank.league).toBe(League.Provisional)
        expect(rank.division).toBeNull()
        expect(rank.points).toBeNull()
        expect(rank.rankedCount).toBe(rankedCount)
      })

      it('does not return Provisional when rankedCount meets the minimum', () => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(
          faker.number.int({ min: 0, max: 1200 }),
          converter.config.min_ranked_count,
          null
        )
        expect(rank.league).not.toBe(League.Provisional)
      })

      it('does not return Provisional when rankedCount is null', () => {
        const converter = createConverter()
        const totalLP = faker.number.int({ min: 0, max: 1599 })
        const rank = converter.getRankFromTotalLP(totalLP, null, null)
        expect(rank.league).not.toBe(League.Provisional)
      })
    })

    describe('league and division mapping', () => {
      it.each([
        // [totalLP, expectedLeague, expectedDivision, expectedPoints]
        [0, League.Bronze, 4, 0],
        [50, League.Bronze, 4, 50],
        [99, League.Bronze, 4, 99],
        [100, League.Bronze, 3, 0],
        [199, League.Bronze, 3, 99],
        [200, League.Bronze, 2, 0],
        [300, League.Bronze, 1, 0],
        [399, League.Bronze, 1, 99],
        [400, League.Silver, 4, 0],
        [650, League.Silver, 2, 50],
        [800, League.Gold, 4, 0],
        [1200, League.Diamond, 4, 0],
        [1599, League.Diamond, 1, 99],
      ])('totalLP=%i → %s D%i with %i pts', (totalLP, expectedLeague, expectedDivision, expectedPoints) => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(totalLP, null, null)

        expect(rank.league).toBe(expectedLeague)
        expect(rank.division).toBe(expectedDivision)
        expect(rank.points).toBe(expectedPoints)
      })
    })

    describe('master and apex tiers', () => {
      it('returns Master with no division when in the master LP range and no apex flag', () => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(1600, null, null)

        expect(rank.league).toBe(League.Master)
        expect(rank.division).toBeNull()
      })

      it('calculates master points as LP above the base apex threshold', () => {
        const converter = createConverter()
        const pointsAboveBase = faker.number.int({ min: 0, max: 500 })
        const rank = converter.getRankFromTotalLP(1600 + pointsAboveBase, null, null)

        expect(rank.points).toBe(pointsAboveBase)
      })

      it('returns Challenger when apex flag is "challenger"', () => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(1700, null, 'challenger')

        expect(rank.league).toBe(League.Challenger)
        expect(rank.division).toBeNull()
      })

      it('returns Master (not Challenger) when apex flag is "grandmaster"', () => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(1700, null, 'grandmaster')

        expect(rank.league).toBe(League.Master)
      })

      it('returns Master when apex flag is null in master LP range', () => {
        const converter = createConverter()
        const rank = converter.getRankFromTotalLP(1700, null, null)

        expect(rank.league).toBe(League.Master)
      })
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('getRankFromElo', () => {
    it('produces the same result as getRankFromTotalLP at the equivalent total LP', () => {
      const converter = createConverter()
      const elo = faker.number.float({ min: 1300, max: 2000 })
      const rankedCount = faker.number.int({ min: 10, max: 100 })

      const fromElo = converter.getRankFromElo(elo, rankedCount, null)
      const fromLP = converter.getRankFromTotalLP(converter.getTotalLP(elo), rankedCount, null)

      expect(fromElo).toEqual(fromLP)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('isChallengerEligible', () => {
    it('returns true exactly at the challenger threshold elo', () => {
      const converter = createConverter()
      // eloForLP(MIN_CHALLENGER_LP) is the exact elo that yields getTotalLP = MIN_CHALLENGER_LP
      expect(converter.isChallengerEligible(eloForLP(MIN_CHALLENGER_LP, converter.config))).toBe(
        true
      )
    })

    it('returns true when LP is well above the threshold', () => {
      const converter = createConverter()
      expect(
        converter.isChallengerEligible(
          eloForLP(MIN_CHALLENGER_LP + LP_PER_LEAGUE, converter.config)
        )
      ).toBe(true)
    })

    it('returns false when LP is well below the threshold', () => {
      const converter = createConverter()
      // LP = MIN_CHALLENGER_LP - LP_PER_LEAGUE = 1300, clearly below the 1700 threshold
      expect(
        converter.isChallengerEligible(
          eloForLP(MIN_CHALLENGER_LP - LP_PER_LEAGUE, converter.config)
        )
      ).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('expectedScore', () => {
    it('returns 0.5 for equal elos', () => {
      const converter = createConverter()
      const elo = faker.number.float({ min: 1000, max: 2000 })

      expect(converter.expectedScore(elo, elo)).toBe(0.5)
    })

    it('returns greater than 0.5 when player A has a higher elo', () => {
      const converter = createConverter()
      const eloA = faker.number.float({ min: 1600, max: 2000 })
      const eloB = faker.number.float({ min: 1000, max: 1400 })

      expect(converter.expectedScore(eloA, eloB)).toBeGreaterThan(0.5)
    })

    it('returns less than 0.5 when player A has a lower elo', () => {
      const converter = createConverter()
      const eloA = faker.number.float({ min: 1000, max: 1400 })
      const eloB = faker.number.float({ min: 1600, max: 2000 })

      expect(converter.expectedScore(eloA, eloB)).toBeLessThan(0.5)
    })

    it('sums to 1 with the reversed call (A and B perspectives)', () => {
      const converter = createConverter()
      const eloA = faker.number.float({ min: 1000, max: 2000 })
      const eloB = faker.number.float({ min: 1000, max: 2000 })

      const sum = converter.expectedScore(eloA, eloB) + converter.expectedScore(eloB, eloA)
      expect(sum).toBeCloseTo(1, 10)
    })

    it('approaches 1 when the elo difference is very large', () => {
      const converter = createConverter()
      expect(converter.expectedScore(3000, 1000)).toBeGreaterThan(0.99)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────

  describe('updateRatings', () => {
    describe('elo update', () => {
      it('increases the winner elo and decreases the loser elo on a decisive result', () => {
        const converter = createConverter()
        const sharedElo = faker.number.float({ min: 1000, max: 2000 })
        const a = createPlayer({ elo: sharedElo, kFactor: 40 })
        const b = createPlayer({ elo: sharedElo, kFactor: 40 })

        const [newA, newB] = converter.updateRatings([a, b], 1)

        expect(newA.elo).toBeGreaterThan(a.elo)
        expect(newB.elo).toBeLessThan(b.elo)
      })

      it('does not change elos on a draw between equal players', () => {
        const converter = createConverter()
        const elo = faker.number.float({ min: 1000, max: 2000 })
        const kFactor = faker.number.float({ min: 10, max: 40 })
        const a = createPlayer({ elo, kFactor })
        const b = createPlayer({ elo, kFactor })

        const [newA, newB] = converter.updateRatings([a, b], 0.5)

        expect(newA.elo).toBeCloseTo(a.elo)
        expect(newB.elo).toBeCloseTo(b.elo)
      })

      it('changes elo proportionally to the k-factor', () => {
        const converter = createConverter()
        const baseElo = faker.number.float({ min: 1000, max: 2000 })
        const [highKResult] = converter.updateRatings(
          [
            createPlayer({ elo: baseElo, kFactor: 40 }),
            createPlayer({ elo: baseElo, kFactor: 40 }),
          ],
          1
        )
        const [lowKResult] = converter.updateRatings(
          [
            createPlayer({ elo: baseElo, kFactor: 20 }),
            createPlayer({ elo: baseElo, kFactor: 40 }),
          ],
          1
        )

        // k=40 should produce exactly twice the gain of k=20
        expect(highKResult.elo - baseElo).toBeCloseTo(2 * (lowKResult.elo - baseElo))
      })
    })

    describe('rankedCount', () => {
      it('increments rankedCount for both players', () => {
        const converter = createConverter()
        const a = createPlayer()
        const b = createPlayer()
        const scoreOfA = faker.number.float({ min: 0, max: 1 })

        const [newA, newB] = converter.updateRatings([a, b], scoreOfA)

        expect(newA.rankedCount).toBe(a.rankedCount + 1)
        expect(newB.rankedCount).toBe(b.rankedCount + 1)
      })
    })

    describe('k-factor deflation', () => {
      it('deflates kFactor towards least_k_factor after a match', () => {
        const converter = createConverter()
        const { k_deflation_factor, least_k_factor } = converter.config
        const initialKFactor = faker.number.float({ min: least_k_factor + 5, max: 60 })
        const a = createPlayer({ kFactor: initialKFactor })
        const b = createPlayer({ kFactor: initialKFactor })

        const [newA, newB] = converter.updateRatings([a, b], faker.number.float({ min: 0, max: 1 }))

        const expectedKFactor =
          initialKFactor * (1 - k_deflation_factor) + least_k_factor * k_deflation_factor
        expect(newA.kFactor).toBeCloseTo(expectedKFactor)
        expect(newB.kFactor).toBeCloseTo(expectedKFactor)
      })

      it('holds kFactor steady when already at least_k_factor', () => {
        const converter = createConverter()
        const { least_k_factor } = converter.config
        const a = createPlayer({ kFactor: least_k_factor })
        const b = createPlayer({ kFactor: least_k_factor })

        const [newA, newB] = converter.updateRatings([a, b], faker.number.float({ min: 0, max: 1 }))

        // least_k × (1 - k_def) + least_k × k_def = least_k
        expect(newA.kFactor).toBeCloseTo(least_k_factor)
        expect(newB.kFactor).toBeCloseTo(least_k_factor)
      })
    })

    describe('apex flag management', () => {
      it('preserves challenger flag when elo stays above the challenger threshold', () => {
        const converter = createConverter()
        // draw at equal elos causes no elo change → stays well above threshold
        const safeElo = eloForLP(MIN_CHALLENGER_LP + LP_PER_LEAGUE, converter.config)
        const a = createPlayer({ elo: safeElo, kFactor: 20, apexFlag: 'challenger' })
        const b = createPlayer({ elo: safeElo, kFactor: 20 })

        const [newA] = converter.updateRatings([a, b], 0.5) // draw — no elo change

        expect(newA.apexFlag).toBe('challenger')
      })

      it('revokes challenger flag when elo is below the challenger threshold', () => {
        const converter = createConverter()
        // LP 400 below threshold; draw at equal elos causes no elo change → stays below
        const belowElo = eloForLP(MIN_CHALLENGER_LP - LP_PER_LEAGUE, converter.config)
        const a = createPlayer({ elo: belowElo, kFactor: 20, apexFlag: 'challenger' })
        const b = createPlayer({ elo: belowElo, kFactor: 20 })

        const [newA] = converter.updateRatings([a, b], 0.5) // draw — no elo change

        expect(newA.apexFlag).toBeNull()
      })

      it('preserves grandmaster flag unconditionally regardless of elo', () => {
        const converter = createConverter()
        // A is well below challenger threshold; losing heavily to a much stronger opponent
        const weakElo = eloForLP(LP_PER_LEAGUE, converter.config) // Silver territory
        const strongElo = eloForLP(MIN_CHALLENGER_LP + LP_PER_LEAGUE * 2, converter.config)
        const a = createPlayer({ elo: weakElo, kFactor: 40, apexFlag: 'grandmaster' })
        const b = createPlayer({ elo: strongElo, kFactor: 40 })

        const [newA] = converter.updateRatings([a, b], 0) // A loses heavily

        expect(newA.apexFlag).toBe('grandmaster')
      })

      it('leaves null apexFlag unchanged for both players', () => {
        const converter = createConverter()
        const a = createPlayer({ apexFlag: null })
        const b = createPlayer({ apexFlag: null })

        const [newA, newB] = converter.updateRatings([a, b], faker.number.float({ min: 0, max: 1 }))

        expect(newA.apexFlag).toBeNull()
        expect(newB.apexFlag).toBeNull()
      })
    })
  })
})
