import { BanUserResponse, ListBansResult } from '@magic3t/api-types'
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ConfigRepository, UserRepository } from '@/infra/database'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import { AdminGuard } from './admin.guard'
import { BanService } from './ban.service'
import { BanUserCommandClass } from './swagger/ban-commands'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private usersRepository: UserRepository,
    private configRepository: ConfigRepository,
    private banService: BanService
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

  @Post('bans')
  @ApiOperation({
    summary: 'Ban a user',
    description: 'Ban a user with temporary or permanent ban. Requires creator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
  })
  async banUser(
    @UserId() creatorId: string,
    @Body() command: BanUserCommandClass
  ): Promise<BanUserResponse> {
    return this.banService.banUser(
      command.userId,
      creatorId,
      command.isPermanent,
      command.reason,
      command.durationMs
    )
  }

  @Delete('bans/:userId')
  @ApiOperation({
    summary: 'Unban a user',
    description: 'Remove all bans from a user. Requires creator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
  })
  async unbanUser(@Param('userId') userId: string): Promise<void> {
    return this.banService.unbanUser(userId)
  }

  @Get('bans')
  @ApiOperation({
    summary: 'List all active bans',
    description: 'Get a list of all currently active bans. Requires creator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active bans',
  })
  async listActiveBans(): Promise<ListBansResult> {
    const data = await this.banService.listActiveBans()
    return { data }
  }
}
