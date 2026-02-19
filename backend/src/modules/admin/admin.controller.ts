import { BanUserBody, BanUserResult, UnbanUserBody, UnbanUserResult } from '@magic3t/api-types'
import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
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

  @ApiOperation({ summary: 'Ban a user temporarily or permanently' })
  @Post('ban-user')
  async banUser(@Body() body: BanUserBody, @UserId() adminId: string): Promise<BanUserResult> {
    const expiresAt = await this.adminService.banUser(
      body.userId,
      adminId,
      body.reason,
      body.durationMinutes
    )

    return {
      success: true,
      bannedUntil: expiresAt,
    }
  }

  @ApiOperation({ summary: 'Unban a user' })
  @Post('unban-user')
  async unbanUser(@Body() body: UnbanUserBody): Promise<UnbanUserResult> {
    await this.adminService.unbanUser(body.userId)

    return {
      success: true,
    }
  }
}
