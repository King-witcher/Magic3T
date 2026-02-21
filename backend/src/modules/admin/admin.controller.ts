import { Admin } from '@magic3t/api-types'
import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ConfigRepository, UserRepository } from '@/infra/firestore'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { AuthService } from '../auth'
import { RatingService } from '../rating'
import { AdminGuard } from './admin.guard'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private usersRepository: UserRepository,
    private configRepository: ConfigRepository,
    private readonly authService: AuthService,
    private readonly ratingService: RatingService
  ) {}

  @ApiOperation({})
  @Post('reset-ratings')
  async resetRatings() {
    const ratingConfig = await this.configRepository.cachedGetRatingConfig()
    const users = await this.usersRepository.listAll()

    await Promise.all(
      users.map(async (user) => {
        this.usersRepository.set(user.id, {
          ...user.data,
          elo: {
            challenger: false,
            score: ratingConfig.initial_elo,
            k: ratingConfig.initial_k_factor,
            matches: 0,
          },
        })
      })
    )
  }

  @Get('accounts')
  async listAccounts(): Promise<Admin.ListAccountsResult> {
    const [accounts] = await this.authService.listAccounts()
    const items = await Promise.all(
      accounts.map(async (user): Promise<Admin.ListAccountsResultItem> => {
        const userRow = await this.usersRepository.getById(user.uid)
        if (!userRow) {
          return {
            id: user.uid,
            userRow: null,
            rating: null,
          }
        }
        const converter = await this.ratingService.getRatingConverter(userRow.data.elo)

        const rating = converter.ratingData
        return {
          id: user.uid,
          userRow: userRow.data,
          rating,
        }
      })
    )
    return { users: items }
  }
}
