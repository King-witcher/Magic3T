import { GetUserResult, ListUsersResult } from '@magic3t/api-types'
import { UserRole, UserRow } from '@magic3t/database-types'
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { range } from 'lodash'
import { respondError } from '@/common'
import { ConfigRepository, UserRepository } from '@/infra/database'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/user-id.decorator'
import {
  ChangeIconCommandClass,
  ChangeNickCommandClass,
  RegisterUserCommandClass,
} from './swagger/user-commands'
import { UserService } from './user.service'

const baseIcons = new Set([...range(59, 79), ...range(0, 30)])

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly configRepository: ConfigRepository
  ) {}

  @Get('id/:id')
  @ApiOperation({
    summary: 'Get a user by id',
  })
  @ApiResponse({
    type: 'object',
  })
  async getById(@Param('id') id: string): Promise<GetUserResult> {
    const row = await this.userRepository.getById(id)
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

    const rows = await this.userRepository.listBestPlayers(MIN_RANKED_MATCHES, 10)
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
  async getMe(@UserId() userId: string) {
    const user = await this.userRepository.getById(userId)
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
    const user = await this.userRepository.getById(userId)
    // User does not exist
    if (!user) respondError('user-not-found', 404, 'User not found')

    // Check nickname change cooldown (30 days)
    const timeSinceLastChange = Date.now() - user.data.identification.last_changed.getTime()
    if (timeSinceLastChange < 1000 * 60 * 60 * 24 * 30) {
      respondError('nickname-change-cooldown', 400, 'Nickname can only be changed every 30 days')
    }

    // Same nickname
    if (user.data.identification.nickname === newNickname) {
      respondError('same-nickname', 400, 'New nickname is the same as the current one')
    }

    // Nickname unavailable
    const nicknameOwner = await this.userRepository.getByNickname(newNickname)
    if (nicknameOwner) {
      respondError('nickname-unavailable', 400, 'This nickname is already taken')
    }

    await this.userRepository.updateNickname(user.id, newNickname)
  }

  @Post('register')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register an authenticated user in the database information',
  })
  async register(@UserId() userId: string, @Body() body: RegisterUserCommandClass) {
    const [previousUserRow, ratingConfig] = await Promise.all([
      this.userRepository.getById(userId),
      this.configRepository.cachedGetRatingConfig(),
    ])

    if (previousUserRow) respondError('user-already-registered')

    const userRow: UserRow = {
      elo: {
        k: ratingConfig.initial_k_factor,
        score: ratingConfig.initial_elo,
        challenger: false,
        matches: 0,
      },
      experience: 0,
      identification: {
        last_changed: new Date(),
        nickname: body.nickname,
        unique_id: this.userRepository.slugify(body.nickname),
      },
      magic_points: 0,
      perfect_squares: 0,
      role: UserRole.Player,
      stats: {
        defeats: 0,
        draws: 0,
        wins: 0,
      },
      summoner_icon: 29,
    }

    await this.userRepository.set(userId, userRow)
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
  async getIcons(@UserId() userId: string) {
    const iconAssigments = await this.userRepository.getIconAssignments(userId)
    const assignedIcons = iconAssigments.map((assigment) => Number.parseInt(assigment.id, 10))
    return [...assignedIcons, ...baseIcons]
  }

  @Patch('me/icon')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update summoner icon',
  })
  @ApiBearerAuth()
  async changeSummonerIcon(@UserId() userId: string, @Body() { iconId }: ChangeIconCommandClass) {
    if (!baseIcons.has(iconId)) {
      const userIcons = await await this.userRepository.getIconAssignments(userId)
      if (!userIcons.some((assignment) => Number(assignment.id) === iconId))
        respondError('icon-unavailable', 400, 'The user does not own this icon')
    }

    await this.userRepository.update(userId, {
      summoner_icon: iconId,
    })
  }
}
