import { GetUserResult, ListUsersResult } from '@magic3t/api-types'
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { range } from 'lodash'
import { respondError } from '@/common'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { ChangeIconCommandClass, ChangeNickCommandClass } from './swagger/user-commands'
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
  async getById(@Param('id') id: number): Promise<GetUserResult> {
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
  async getMe(@UserId() id: number) {
    const user = await this.userRepository.getById(id)
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
    @UserId() userId: number,
    @Body() { nickname: newNickname }: ChangeNickCommandClass
  ) {
    const user = await this.userRepository.getById(userId)
    // User does not exist
    if (!user) respondError('UserNotFound', 404, 'User not found')

    // Check nickname change cooldown (30 days)
    const now = new Date()
    const ONE_MONTH = 1000 * 60 * 60 * 24 * 30
    const timeSinceLastChange = now.getTime() - user.profile_nickname_date.getTime()
    if (timeSinceLastChange < ONE_MONTH) {
      respondError('NicknameChangeCooldown', 400, 'Nickname can only be changed every 30 days')
    }

    // Same nickname
    if (user.profile_nickname === newNickname) {
      respondError('SameNickname', 400, 'New nickname is the same as the current one')
    }

    // Nickname unavailable
    const nicknameOwner = await this.userRepository.getByNickname(newNickname)
    if (nicknameOwner) {
      respondError('NicknameUnavailable', 400, 'This nickname is already taken')
    }

    await this.userRepository.updateNickname(userId, newNickname)
  }

  // @Post('register')
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Register an authenticated user in the database information',
  // })
  // async register(@UserId() firebaseId: string, @Body() body: RegisterUserCommandClass) {
  //   const previousUserRow = await this.userRepository.getByFirebaseId(firebaseId)

  //   if (previousUserRow) respondError('UserAlreadyRegistered', 400, 'User is already registered')

  //   await this.userRepository.register(firebaseId, body.nickname)
  // }

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
  async getIcons(@UserId() id: number) {
    const icons = await this.userRepository.getUserIcons(id)
    const assignedIcons = icons.map((icon) => icon.id)
    return [...assignedIcons, ...baseIcons]
  }

  @Patch('me/icon')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update summoner icon',
  })
  @ApiBearerAuth()
  async changeSummonerIcon(@UserId() id: number, @Body() { iconId }: ChangeIconCommandClass) {
    if (!baseIcons.has(iconId)) {
      const userIcons = await this.userRepository.getUserIcons(id)
      if (!userIcons.some((assignment) => assignment.id === iconId))
        respondError('icon-unavailable', 400, 'The user does not own this icon')
    }

    await this.userRepository.updateIcon(id, iconId)
  }
}
