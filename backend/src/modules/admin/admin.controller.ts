import { Admin } from '@magic3t/api-types'
import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { IconRepository } from '@/infra/database/repositories/icon-repository'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { ConfigRepository, UserDocumentRepository } from '@/infra/firestore'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { AuthService } from '../auth'
import { RatingService } from '../rating'
import { AdminGuard } from './admin.guard'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userRepository: UserRepository,
    private userDocumentRepository: UserDocumentRepository,
    private configRepository: ConfigRepository,
    private iconRepository: IconRepository,
    private readonly authService: AuthService,
    private readonly ratingService: RatingService
  ) {}

  @ApiOperation({
    summary: 'Reset all user ratings to the initial values',
  })
  @Post('reset-ratings')
  async resetRatings() {
    const ratingConfig = await this.configRepository.cachedGetRatingConfig()
    const users = await this.userDocumentRepository.listAll()

    await Promise.all(
      users.map(async (user) => {
        this.userDocumentRepository.set(user.id, {
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

  @ApiOperation({
    summary: 'List all user accounts',
    description: 'Returns a list of all user accounts with their details.',
  })
  @Get('accounts')
  async listAccounts(): Promise<Admin.ListAccountsResult> {
    const [accounts] = await this.authService.listAccounts()
    const items = await Promise.all(
      accounts.map(async (user): Promise<Admin.ListAccountsResultItem> => {
        const userRow = await this.userDocumentRepository.getById(user.uid)
        if (!userRow) {
          return {
            id: user.uid,
            userRow: null,
            metadata: {
              lastSignInTime: user.metadata.lastSignInTime,
              creationTime: user.metadata.creationTime,
              lastRefreshTime: user.metadata.lastRefreshTime ?? null,
            },
            accountData: {
              displayName: user.displayName ?? 'not provided',
              email: user.email ?? 'not provided',
            },
            rating: null,
          }
        }
        const converter = await this.ratingService.getRatingConverter(userRow.data.elo)

        const rating = converter.ratingData
        return {
          id: user.uid,
          metadata: {
            lastSignInTime: user.metadata.lastSignInTime,
            creationTime: user.metadata.creationTime,
            lastRefreshTime: user.metadata.lastRefreshTime ?? null,
          },
          accountData: {
            displayName: user.displayName ?? 'not provided',
            email: user.email ?? 'not provided',
          },
          userRow: userRow.data,
          rating,
        }
      })
    )
    return { users: items }
  }

  @ApiOperation({
    summary: 'Synchronize icons with Riot API',
  })
  @Post('sync-icons')
  async syncIcons() {
    await this.iconRepository.syncIcons()
  }

  @ApiOperation({
    summary: 'Import users from Firestore',
  })
  @Post('import-users')
  async importUsers() {
    await this.userRepository.importFromFirestore()
  }
}
