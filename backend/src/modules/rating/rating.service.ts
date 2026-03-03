import { ClientRank, Division, League } from '@magic3t/common-types'
import { UserDocumentElo } from '@magic3t/database-types'
import { Injectable, Logger, NotImplementedException } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as Sentry from '@sentry/node'
import { clamp } from 'lodash'
import { ConfigService } from '@/infra/config/config.service'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { RatingConverter } from './rating-converter'

const MAX_CHALLENGERS = 1

const BASE_APEX_POINTS = 400 * 4

const LEAGUE_INDICES = [
  League.Bronze, // 0
  League.Silver, // 1
  League.Gold, // 2
  League.Diamond, //3
  League.Master, //4
]

export type RatingState = {
  elo: number
  kFactor: number
}

@Injectable()
export class RatingService {
  private logger = new Logger(RatingService.name)

  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository
  ) {}

  @Cron('0 12 * * *')
  async updateChallengers() {
    this.logger.log('Updating Challengers')
    const config = await this.configService.ratingConfig
    const bestPlayers = await this.userRepository.getLeaderboard(5, MAX_CHALLENGERS)

    const challengers = bestPlayers.filter((user) => {
      const rating = new RatingConverter(
        {
          challenger: user.rating_apex === 'challenger',
          k: user.rating_k_factor,
          matches: user.rating_series_played,
          score: user.rating_score,
        },
        config
      )
      return rating.isChallengerEligible
    })

    await this.userRepository.setOrReplaceChallengers(challengers.map((c) => c.firebase_id!))

    Sentry.logger.info('Updated Challengers', {
      challengers: challengers.map((c) => c.profile_nickname),
    })
    this.logger.log(`Updated Challengers: ${challengers.map((c) => c.profile_nickname).join(', ')}`)
  }

  /**
   * Gets the rating converter, which provides detailed rating information and utility methods with up to date config.
   * @deprecated
   */
  async getRatingConverter(elo: UserDocumentElo): Promise<RatingConverter> {
    const config = await this.configService.ratingConfig
    const rating = new RatingConverter(elo, config)
    return rating
  }

  /** @deprecated */
  async getRawLP(rating: number): Promise<number> {
    const config = await this.configService.ratingConfig
    const eloPerLeague = config.elo_per_league
    return Math.round((400 * rating) / eloPerLeague)
  }

  async getTotalPoints(eloScore: number): Promise<number> {
    const config = await this.configService.ratingConfig
    const eloAboveInitial = eloScore - config.initial_elo
    const leaguesAboveInitial = eloAboveInitial / config.elo_per_league
    const leaguesAboveLowest = leaguesAboveInitial + config.initial_league_index
    const lPAboveLowest = 400 * leaguesAboveLowest
    return Math.floor(lPAboveLowest)
  }

  /** Gets the client rank based on total points. All apex tiers are considered as master. */
  getClientRank(totalPoints: number): ClientRank {
    const leagueIndex = clamp(Math.floor(totalPoints / 400), 0, 4)
    const league = LEAGUE_INDICES[leagueIndex]

    if (league === League.Master) {
      return {
        league,
        division: null,
        points: totalPoints - BASE_APEX_POINTS,
        progress: 1,
      }
    }

    const pointsSinceDivision4 = totalPoints % 400
    const division = (4 - Math.floor(pointsSinceDivision4 / 100)) as Division
    const points = pointsSinceDivision4 % 100

    return {
      league,
      division,
      points,
      progress: 1,
    }
  }

  async isChallengerEllegible(eloScore: number): Promise<boolean> {
    const totalPoints = await this.getTotalPoints(eloScore)
    return totalPoints >= BASE_APEX_POINTS + 100
  }

  expectedScore(eloA: number, eloB: number): number {
    const expectedScoreA = 1 / (1 + 10 ** ((eloB - eloA) / 400))
    return expectedScoreA
  }

  async updateRatings(
    [a, b]: [RatingState, RatingState],
    scoreOfA: number
  ): Promise<[RatingState, RatingState]> {
    const config = await this.configService.ratingConfig

    const expectedScoreA = this.expectedScore(a.elo, b.elo)
    const expectedScoreB = 1 - expectedScoreA

    const newEloA = a.elo + a.kFactor * (scoreOfA - expectedScoreA)
    const newEloB = b.elo + b.kFactor * (1 - scoreOfA - expectedScoreB)

    // TODO: rename to min k factor and k factor decay
    const newKFactorA =
      a.kFactor * (1 - config.k_deflation_factor) +
      config.least_k_factor * config.k_deflation_factor
    const newKFactorB =
      b.kFactor * (1 - config.k_deflation_factor) +
      config.least_k_factor * config.k_deflation_factor

    return [
      { elo: newEloA, kFactor: newKFactorA },
      { elo: newEloB, kFactor: newKFactorB },
    ]
  }
}
