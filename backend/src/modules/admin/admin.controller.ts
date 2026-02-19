import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { respondError } from '@/common'
import { ConfigRepository, UserRepository } from '@/infra/database'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import { AdminGuard } from './admin.guard'
import { BanUserCommandClass } from './swagger/admin-commands'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private usersRepository: UserRepository,
    private configRepository: ConfigRepository
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

  @ApiOperation({
    summary: 'Ban a user',
    description:
      'Bans a user by user id. The ban can be temporary (with a duration in seconds) or permanent.',
  })
  @Post('ban/:userId')
  async banUser(
    @Param('userId') targetId: string,
    @UserId() creatorId: string,
    @Body() body: BanUserCommandClass
  ) {
    const target = await this.usersRepository.getById(targetId)
    if (!target) respondError('user-not-found', 404, 'User not found')

    const expiresAt = body.duration != null ? new Date(Date.now() + body.duration * 1000) : null

    await this.usersRepository.banUser(targetId, {
      reason: body.reason,
      expiresAt,
      bannedBy: creatorId,
    })
  }

  @ApiOperation({
    summary: 'Unban a user',
    description: 'Removes the ban from a user by user id.',
  })
  @Delete('ban/:userId')
  async unbanUser(@Param('userId') targetId: string) {
    const target = await this.usersRepository.getById(targetId)
    if (!target) respondError('user-not-found', 404, 'User not found')

    await this.usersRepository.unbanUser(targetId)
  }
}
