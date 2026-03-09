import { Controller, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { respondError } from '@/common'
import { IconRepository } from '@/infra/database/repositories/icon-repository'
import { UserRepository } from '@/infra/database/repositories/user-repository'

@Controller('admin')
// @UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userRepository: UserRepository,
    private iconRepository: IconRepository
  ) {}

  @ApiOperation({
    summary: 'Reset all user ratings to the initial values',
  })
  @Post('reset-ratings')
  async resetRatings() {
    respondError(
      'This endpoint is deprecated and will be removed in the future. Please use a script or admin panel to reset ratings.',
      410,
      'Endpoint deprecated'
    )
    // const ratingConfig = await this.configRepository.cachedGetRatingConfig()
    // const users = await this.userDocumentRepository.listAll()

    // await Promise.all(
    //   users.map(async (user) => {
    //     this.userDocumentRepository.set(user.id, {
    //       ...user.data,
    //       elo: {
    //         challenger: false,
    //         score: ratingConfig.initial_elo,
    //         k: ratingConfig.initial_k_factor,
    //         matches: 0,
    //       },
    //     })
    //   })
    // )
  }

  // @ApiOperation({
  //   summary: 'List all user accounts',
  //   description: 'Returns a list of all user accounts with their details.',
  // })
  // @Get('accounts')
  // async listAccounts(): Promise<Admin.ListAccountsResult> {
  //   const [accounts] = await this.authService.listAccounts()
  //   const items = await Promise.all(
  //     accounts.map(async (user): Promise<Admin.ListAccountsResultItem> => {
  //       const userRow = await this.userRepository.getByFirebaseId(user.uid)
  //       if (!userRow) {
  //         return {
  //           id: user.uid,
  //           userRow: null,
  //           metadata: {
  //             lastSignInTime: user.metadata.lastSignInTime,
  //             creationTime: user.metadata.creationTime,
  //             lastRefreshTime: user.metadata.lastRefreshTime ?? null,
  //           },
  //           accountData: {
  //             displayName: user.displayName ?? 'not provided',
  //             email: user.email ?? 'not provided',
  //           },
  //           rating: null,
  //         }
  //       }
  //       const converter = await this.ratingService.getRatingConverter({
  //         challenger: userRow.rating_apex === 'challenger',
  //         k: userRow.rating_k_factor,
  //         matches: userRow.rating_series_played,
  //         score: userRow.rating_score,
  //       })

  //       const rating = converter.ratingData
  //       return {
  //         id: user.uid,
  //         metadata: {
  //           lastSignInTime: user.metadata.lastSignInTime,
  //           creationTime: user.metadata.creationTime,
  //           lastRefreshTime: user.metadata.lastRefreshTime ?? null,
  //         },
  //         accountData: {
  //           displayName: user.displayName ?? 'not provided',
  //           email: user.email ?? 'not provided',
  //         },
  //         userRow: {
  //           elo: {
  //             challenger: userRow.rating_apex === 'challenger',
  //             score: userRow.rating_score,
  //             k: userRow.rating_k_factor,
  //             matches: userRow.rating_series_played,
  //           },
  //           experience: userRow.xp,
  //           identification: {
  //             nickname: userRow.profile_nickname,
  //             unique_id: userRow.profile_nickname_slug,
  //             last_changed: userRow.profile_nickname_date,
  //           },
  //           magic_points: 0,
  //           perfect_squares: 0,
  //           role: UserDocumentRole.Bot,
  //           summoner_icon: userRow.profile_icon,
  //           stats: {
  //             defeats: userRow.stats_defeats,
  //             draws: userRow.stats_draws,
  //             wins: userRow.stats_victories,
  //           },
  //         },
  //         rating,
  //       }
  //     })
  //   )
  //   return { users: items }
  // }

  @ApiOperation({
    summary: 'Sync Icons',
    description: 'Fetches the latest icons from Riot API and updates the local database.',
  })
  @Post('sync-icons')
  async syncIcons() {
    await this.iconRepository.syncIcons()
  }

  @ApiOperation({
    summary: 'Import users from Firebase',
    description: 'Imports user data from Firebase into the local database.',
  })
  @Post('import-users')
  async importUsers() {
    await this.userRepository.importFromFirebase()
  }
}
