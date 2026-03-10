import {
  BanUserCommand,
  BanUserResult,
  UnbanUserCommand,
  UnbanUserResult,
} from '@magic3t/api-types'
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ConfigRepository, UserRepository } from '@/infra/database'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import { AdminGuard } from './admin.guard'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private usersRepository: UserRepository,
    private configRepository: ConfigRepository,
    private adminService: AdminService
  ) {}

  @ApiOperation({ summary: 'Reset all user ratings to initial values' })
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

  @ApiOperation({ summary: 'Ban a user (temporary or permanent)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The ID of the user to ban' },
        type: { type: 'string', enum: ['permanent', 'temporary'], description: 'Type of ban' },
        reason: { type: 'string', description: 'Reason for the ban' },
        duration: { type: 'number', description: 'Duration in seconds (for temporary bans)' },
      },
      required: ['userId', 'type', 'reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ban parameters' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post('ban')
  async banUser(
    @Body() command: BanUserCommand,
    @UserId() adminId: string
  ): Promise<BanUserResult> {
    return this.adminService.banUser(command, adminId)
  }

  @ApiOperation({ summary: 'Remove a ban from a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The ID of the user to unban' },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 400, description: 'User is not banned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete('ban')
  async unbanUser(
    @Body() command: UnbanUserCommand,
    @UserId() adminId: string
  ): Promise<UnbanUserResult> {
    return this.adminService.unbanUser(command.userId, adminId)
  }
}
