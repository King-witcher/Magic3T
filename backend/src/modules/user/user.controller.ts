import { GetUserResult, ListUsersResult } from '@magic3t/api-types'
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { range } from 'lodash'
import { respondError } from '@/common'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import {
  ChangeIconCommandClass,
  ChangeNickCommandClass,
  RegisterUserCommandClass,
} from './swagger/user-commands'
import { UserService } from './user.service'

const baseIcons = new Set([...range(0, 30)])

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository
  ) {}

  @Get('id/:id')
  @ApiOperation({
    summary: 'Get a user by id',
  })
  @ApiResponse({
    type: 'object',
  })
  async getById(@Param('id') firebaseId: string): Promise<GetUserResult> {
    const row = await this.userRepository.getByFirebaseId(firebaseId)
    if (!row) respondError('user-not-found', 404, 'User not found')
    return this.userService.getUserByRow(row)
  }

  @Get('nickname/:nickname')
  @ApiOperation({
    summary: 'Get a user by nickname',
    description: 'Casing and spaces are ignored.',
  })
  @ApiResponse({
    type: 'object',
  })
  async getByNickname(@Param('nickname') nickname: string): Promise<GetUserResult> {
    const row = await this.userRepository.getByNickname(nickname)
    if (!row) respondError('user-not-found', 404, 'User not found')
    return this.userService.getUserByRow(row)
  }

  @Get('ranking')
  @ApiOperation({
    summary: 'Get leaderboard ranking',
    description: 'Gets the top 10 ranked players',
  })
  @ApiResponse({
    isArray: true,
    type: 'object',
  })
  async getLeaderboard(): Promise<ListUsersResult> {
    const MIN_RANKED_MATCHES = 5

    const rows = await this.userRepository.getLeaderboard(MIN_RANKED_MATCHES, 10)
    return {
      data: await Promise.all(rows.map((row) => this.userService.getListedUserByRow(row))),
    }
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get the currently connected user',
  })
  @ApiResponse({
    type: 'object',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getMe(@UserId() firebaseId: string) {
    const user = await this.userRepository.getByFirebaseId(firebaseId)
    if (!user) respondError('user-not-found', 404, 'User not found')
    return this.userService.getUserByRow(user)
  }

  @Patch('me/nickname')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update nickname',
  })
  async changeNickName(
    @UserId() userId: string,
    @Body() { nickname: newNickname }: ChangeNickCommandClass
  ) {
    const user = await this.userRepository.getByFirebaseId(userId)
    // User does not exist
    if (!user) respondError('user-not-found', 404, 'User not found')

    // Check nickname change cooldown (30 days)
    const timeSinceLastChange = Date.now() - user.profile_nickname_date.getTime()
    if (timeSinceLastChange < 1000 * 60 * 60 * 24 * 30) {
      respondError('nickname-change-cooldown', 400, 'Nickname can only be changed every 30 days')
    }

    // Same nickname
    if (user.profile_nickname === newNickname) {
      respondError('same-nickname', 400, 'New nickname is the same as the current one')
    }

    // Nickname unavailable
    const nicknameOwner = await this.userRepository.getByNickname(newNickname)
    if (nicknameOwner) {
      respondError('nickname-unavailable', 400, 'This nickname is already taken')
    }

    await this.userRepository.updateNickname(user.firebase_id!, newNickname)
  }

  @Post('register')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register an authenticated user in the database information',
  })
  async register(@UserId() firebaseId: string, @Body() body: RegisterUserCommandClass) {
    const previousUserRow = await this.userRepository.getByFirebaseId(firebaseId)

    if (previousUserRow) respondError('user-already-registered')

    await this.userRepository.register(firebaseId, body.nickname)
  }

  @Get('me/icons')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get all available icons for a user',
  })
  @ApiResponse({
    type: Number,
    isArray: true,
    description: 'A list with all icon ids available',
  })
  @ApiBearerAuth()
  async getIcons(@UserId() firebaseId: string) {
    const icons = await this.userRepository.getUserIcons(firebaseId)
    const assignedIcons = icons.map((icon) => icon.id)
    return [...assignedIcons, ...baseIcons]
  }

  @Patch('me/icon')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update summoner icon',
  })
  @ApiBearerAuth()
  async changeSummonerIcon(
    @UserId() firebaseId: string,
    @Body() { iconId }: ChangeIconCommandClass
  ) {
    if (!baseIcons.has(iconId)) {
      const userIcons = await this.userRepository.getUserIcons(firebaseId)
      if (!userIcons.some((assignment) => assignment.id === iconId))
        respondError('icon-unavailable', 400, 'The user does not own this icon')
    }

    await this.userRepository.updateIcon(firebaseId, iconId)
  }
}
