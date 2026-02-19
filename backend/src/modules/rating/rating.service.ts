import { RatingConfigRow, UserRowElo } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as Sentry from '@sentry/node'
import { ConfigRepository, UserRepository } from '@/infra/firestore'
import { RatingConverter } from './rating-converter'

const MAX_CHALLENGERS = 1

@Injectable()
export class RatingService {
  private logger = new Logger(RatingService.name)

  constructor(
    private configRepository: ConfigRepository,
    private usersRepository: UserRepository
  ) {}

  private get ratingConfig(): Promise<RatingConfigRow> {
    return this.configRepository.cachedGetRatingConfig()
  }

  @Cron('0 12 * * *')
  async updateChallengers() {
    this.logger.log('Updating Challengers')
    const config = await this.ratingConfig
    const bestPlayers = await this.usersRepository.listBestPlayers(5, MAX_CHALLENGERS)

    const challengers = bestPlayers.filter((user) => {
      const rating = new RatingConverter(user.data.elo, config)
      return rating.isChallengerEligible
    })

    await this.usersRepository.setOrReplaceChallengers(challengers.map((c) => c.id))

    Sentry.logger.info('Updated Challengers', {
      challengers: challengers.map((c) => c.data.identification.unique_id),
    })
    this.logger.log(
      `Updated Challengers: ${challengers.map((c) => c.data.identification.unique_id).join(', ')}`
    )
  }

  /**
   * Gets the rating covnerter, which provides detailed rating information and utility methods with up to date config.
   */
  async getRatingConverter(elo: UserRowElo): Promise<RatingConverter> {
    const config = await this.ratingConfig
    const rating = new RatingConverter(elo, config)
    return rating
  }

  async getRawLP(rating: number): Promise<number> {
    const config = await this.ratingConfig
    return Math.round((400 * rating) / config.elo_per_league)
  }
}
