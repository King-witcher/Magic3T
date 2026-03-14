import { GetUserResult, ListUsersResult } from '@magic3t/api-types'
import { Body, Controller, Get, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import z from 'zod'
import { ResponseSchema } from '@/common'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { getUserResultSchema } from './swagger/get-user-schema'
import { ChangeIconCommandClass, ChangeNickCommandClass } from './swagger/user-commands'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('id/:uuid')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ type: 'object' })
  async getById(@Param('uuid') uuid: string): Promise<GetUserResult> {
    return this.userService.getByUUID(uuid)
  }

  @Get('nickname/:nickname')
  @ApiOperation({
    summary: 'Get a user by nickname',
    description: 'Casing and spaces are ignored.',
  })
  @ApiResponse({ type: 'object' })
  async getByNickname(@Param('nickname') nickname: string): Promise<GetUserResult> {
    return this.userService.getByNickname(nickname)
  }

  @Get('ranking')
  @ApiOperation({
    summary: 'Get leaderboard ranking',
    description: 'Gets the top 10 ranked players',
  })
  @ApiResponse({ isArray: true, type: 'object' })
  async getLeaderboard(): Promise<ListUsersResult> {
    return this.userService.getLeaderboard()
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current authenticated profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ResponseSchema({
    description: 'Successfully retrieved user profile.',
    schema: getUserResultSchema,
  })
  @ResponseSchema({
    description: 'The session ID is missing or invalid.',
    schema: z.object({
      errorCode: z.literal('InvalidSession'),
      metadata: z.string().describe('Some extra description'),
    }),
    status: HttpStatus.UNAUTHORIZED,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getMe(@UserId() id: number): Promise<GetUserResult> {
    return this.userService.getProfile(id)
  }

  @Patch('me/nickname')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update nickname' })
  async changeNickname(
    @UserId() userId: number,
    @Body() { nickname }: ChangeNickCommandClass
  ): Promise<void> {
    await this.userService.changeNickname(userId, nickname)
  }

  @Get('me/icons')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all available icons for a user' })
  @ApiResponse({ type: Number, isArray: true, description: 'A list with all icon ids available' })
  @ApiBearerAuth()
  async getIcons(@UserId() id: number): Promise<number[]> {
    return this.userService.getAvailableIcons(id)
  }

  @Patch('me/icon')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update summoner icon' })
  @ApiBearerAuth()
  async changeIcon(
    @UserId() id: number,
    @Body() { iconId }: ChangeIconCommandClass
  ): Promise<void> {
    await this.userService.changeIcon(id, iconId)
  }
}
