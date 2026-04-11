import { faker } from '@faker-js/faker'
import { League } from '@magic3t/common-types'
import type { RatingConfigDocument, UserApexFlag } from '@magic3t/database-types'
import type {
  FullyJoinedMatchRow,
  MatchRepository,
  MatchRowWithRatings,
} from '@/infra/database/repositories/match-repository'
import type { ConfigRepository } from '@/infra/firestore'
import { RankConverter } from '@/modules/rating'
import { MatchHistoryService } from './match-history.service'

// ─── Factories ────────────────────────────────────────────────────────────────

function createConfig(overrides: Partial<RatingConfigDocument> = {}): RatingConfigDocument {
  return {
    initial_elo: 1500,
    elo_per_league: 400,
    initial_league_index: 2,
    least_k_factor: 10,
    initial_k_factor: 40,
    k_deflation_factor: 0.1,
    min_ranked_count: 10,
    ...overrides,
  }
}

function createRatingSnapshot(
  overrides: Partial<{
    score: number
    apex_flag: UserApexFlag | null
    hidden: boolean
    date: Date
  }> = {}
) {
  return {
    score: faker.number.float({ min: 1200, max: 1800 }),
    apex_flag: null as UserApexFlag | null,
    hidden: false,
    date: faker.date.recent(),
    ...overrides,
  }
}

function createBaseMatch(overrides: Partial<MatchRowWithRatings> = {}): MatchRowWithRatings {
  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    uuid: faker.string.uuid(),
    order_id: faker.string.uuid(),
    order_nickname: faker.internet.username(),
    order_match_score: 1,
    order_old_rating: faker.number.int({ min: 1, max: 1000 }),
    order_lp_gain: faker.number.int({ min: -20, max: 20 }),
    order_time_spent: faker.number.int({ min: 5000, max: 60000 }),
    chaos_id: faker.string.uuid(),
    chaos_nickname: faker.internet.username(),
    chaos_match_score: 0,
    chaos_old_rating: faker.number.int({ min: 1, max: 1000 }),
    chaos_lp_gain: faker.number.int({ min: -20, max: 20 }),
    chaos_time_spent: faker.number.int({ min: 5000, max: 60000 }),
    winner: 'order',
    total_time_spent: faker.number.int({ min: 10000, max: 120000 }),
    date: faker.date.recent(),
    order_rating: createRatingSnapshot(),
    chaos_rating: createRatingSnapshot(),
    ...overrides,
  }
}

function createFullMatch(overrides: Partial<FullyJoinedMatchRow> = {}): FullyJoinedMatchRow {
  return {
    ...createBaseMatch(overrides),
    events: [
      { time_ms: 1000, type: 'choice', team: 'order', choice: 5 },
      { time_ms: 2000, type: 'choice', team: 'chaos', choice: 7 },
    ],
    ...overrides,
  }
}

// ─── Mock Dependencies ────────────────────────────────────────────────────────

function createService(config: RatingConfigDocument = createConfig()) {
  const matchRepository = {
    getByUuid: vi.fn<MatchRepository['getByUuid']>(),
    getByUserUuid: vi.fn<MatchRepository['getByUserUuid']>(),
  }

  const configRepository = {
    getRatingConfig: vi.fn<ConfigRepository['getRatingConfig']>().mockResolvedValue(config),
  }

  const service = new MatchHistoryService(
    matchRepository as unknown as MatchRepository,
    configRepository as unknown as ConfigRepository
  )

  return { service, matchRepository, configRepository }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe(MatchHistoryService, () => {
  describe('getMatchByUuid', () => {
    it('returns null when the match is not found', async () => {
      const { service, matchRepository } = createService()
      matchRepository.getByUuid.mockResolvedValue(null)

      const result = await service.getMatchByUuid(faker.string.uuid())
      expect(result).toBeNull()
    })

    it('returns the match with events', async () => {
      const match = createFullMatch()
      const { service, matchRepository } = createService()
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      expect(result).not.toBeNull()
      expect(result!.uuid).toBe(match.uuid)
      expect(result!.winner).toBe(match.winner)
      expect(result!.events).toHaveLength(2)
      expect(result!.order.uuid).toBe(match.order_id)
      expect(result!.chaos.uuid).toBe(match.chaos_id)
      expect(result!.order.nickname).toBe(match.order_nickname)
      expect(result!.chaos.nickname).toBe(match.chaos_nickname)
    })

    it('computes rank from rating snapshot', async () => {
      const config = createConfig()
      const match = createFullMatch({
        order_rating: createRatingSnapshot({ score: 1500, hidden: false }),
      })
      const { service, matchRepository } = createService(config)
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      const converter = new RankConverter(config)
      const expectedRank = converter.getRankFromElo(1500, null, null)
      expect(result!.order.rank).toEqual(expectedRank)
    })

    it('returns provisional rank when rating is null', async () => {
      const match = createFullMatch({ order_rating: null })
      const { service, matchRepository } = createService()
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      expect(result!.order.rank.league).toBe(League.Provisional)
    })

    it('computes LP gain from delta', async () => {
      const config = createConfig()
      const delta = 15
      const match = createFullMatch({ order_lp_gain: delta })
      const { service, matchRepository } = createService(config)
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      const converter = new RankConverter(config)
      expect(result!.order.lpGain).toBe(converter.getLpGain(0, delta))
    })

    it('returns null LP gain when delta is null', async () => {
      const match = createFullMatch({ order_lp_gain: null })
      const { service, matchRepository } = createService()
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      expect(result!.order.lpGain).toBeNull()
    })

    it('maps event types correctly', async () => {
      const match = createFullMatch({
        events: [
          { time_ms: 1000, type: 'choice', team: 'order', choice: 5 },
          { time_ms: 5000, type: 'forfeit', team: 'chaos', choice: null },
        ],
      })
      const { service, matchRepository } = createService()
      matchRepository.getByUuid.mockResolvedValue(match)

      const result = await service.getMatchByUuid(match.uuid)

      expect(result!.events[0]).toEqual({ event: 'choice', team: 'order', time: 1000, choice: 5 })
      expect(result!.events[1]).toEqual({ event: 'forfeit', team: 'chaos', time: 5000 })
    })
  })

  describe('listMatchesByUserUuid', () => {
    it('returns empty matches array when no matches exist', async () => {
      const { service, matchRepository } = createService()
      matchRepository.getByUserUuid.mockResolvedValue([])

      const result = await service.listMatchesByUserUuid(faker.string.uuid(), 10)

      expect(result.matches).toEqual([])
    })

    it('returns mapped matches without events', async () => {
      const match = createBaseMatch()
      const { service, matchRepository } = createService()
      matchRepository.getByUserUuid.mockResolvedValue([match])

      const result = await service.listMatchesByUserUuid(faker.string.uuid(), 10)

      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].uuid).toBe(match.uuid)
      expect(result.matches[0].order.nickname).toBe(match.order_nickname)
      expect('events' in result.matches[0]).toBe(false)
    })

    it('passes the limit to the repository', async () => {
      const { service, matchRepository } = createService()
      matchRepository.getByUserUuid.mockResolvedValue([])
      const uuid = faker.string.uuid()
      const limit = faker.number.int({ min: 1, max: 50 })

      await service.listMatchesByUserUuid(uuid, limit)

      expect(matchRepository.getByUserUuid).toHaveBeenCalledWith(uuid, limit)
    })

    it('fetches the rating config only once for multiple matches', async () => {
      const matches = [createBaseMatch(), createBaseMatch(), createBaseMatch()]
      const { service, matchRepository, configRepository } = createService()
      matchRepository.getByUserUuid.mockResolvedValue(matches)

      await service.listMatchesByUserUuid(faker.string.uuid(), 10)

      expect(configRepository.getRatingConfig).toHaveBeenCalledTimes(1)
    })

    it('handles hidden ratings as provisional (rankedCount=0)', async () => {
      const config = createConfig()
      const match = createBaseMatch({
        order_rating: createRatingSnapshot({ score: 1500, hidden: true }),
      })
      const { service, matchRepository } = createService(config)
      matchRepository.getByUserUuid.mockResolvedValue([match])

      const result = await service.listMatchesByUserUuid(faker.string.uuid(), 10)

      // hidden=true → rankedCount=0 → below min_ranked_count → Provisional
      const converter = new RankConverter(config)
      const expectedRank = converter.getRankFromElo(1500, 0, null)
      expect(result.matches[0].order.rank).toEqual(expectedRank)
    })
  })
})
