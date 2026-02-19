import { BanUserCommand } from '@magic3t/api-types'
import { UserBanType } from '@magic3t/database-types'
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator'
import { respondError } from '@/common'
import { ConfigRepository, UserRepository } from '@/infra/database'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import { AdminGuard } from './admin.guard'

export class BanUserCommandClass implements BanUserCommand {
  @ApiProperty({
    enum: [UserBanType.Temporary, UserBanType.Permanent],
  })
  @IsEnum([UserBanType.Temporary, UserBanType.Permanent])
  type: UserBanType

  @ApiProperty({
    required: false,
    description: 'Required for temporary bans. Duration in seconds.',
  })
  @ValidateIf((o) => o.type === UserBanType.Temporary)
  @IsNumber()
  @Min(1)
  durationSeconds?: number

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string
}

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private usersRepository: UserRepository,
    private configRepository: ConfigRepository
  ) {}

  @ApiOperation({
    summary: 'Ban a user (temporary or permanent)',
  })
  @Post('users/:id/ban')
  async banUser(
    @UserId() actorId: string,
    @Param('id') userId: string,
    @Body() body: BanUserCommandClass
  ) {
    if (actorId === userId) {
      respondError('cannot-ban-self', 400, 'You cannot ban yourself')
    }

    const user = await this.usersRepository.getById(userId)
    if (!user) respondError('user-not-found', 404, 'User not found')

    let expiresAt: Date | null = null
    if (body.type === UserBanType.Temporary) {
      if (!body.durationSeconds || body.durationSeconds <= 0) {
        respondError('invalid-ban-duration', 400, 'Temporary bans require a duration in seconds')
      }

      expiresAt = new Date(Date.now() + body.durationSeconds * 1000)
    }

    await this.usersRepository.setBan(userId, {
      type: body.type,
      created_at: new Date(),
      banned_by: actorId,
      reason: body.reason,
      expires_at: expiresAt,
    })
  }

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
}
