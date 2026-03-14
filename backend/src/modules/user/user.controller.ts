import {
  ChangeIconCommand,
  ChangeNicknameCommand,
  GetUserResult,
  ListUsersResult,
} from '@magic3t/api-types'
import { Body, Controller, Get, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import z from 'zod'
import { BodySchema, ResponseSchema } from '@/common'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { NICKNAME_SCHEMA } from '@/shared/validation'
import { GET_USER_SCHEMA, LIST_USERS_SCHEMA } from './swagger/get-user-schema'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('id/:uuid')
  @ApiOperation({ summary: 'Get user by id', description: 'Returns a user by their unique UUID.' })
  @ResponseSchema({
    schema: GET_USER_SCHEMA,
  })
  async getById(@Param('uuid') uuid: string): Promise<GetUserResult> {
    return this.userService.getByUUID(uuid)
  }

  @Get('nickname/:nickname')
  @ApiOperation({
    summary: 'Get user by nickname',
    description:
      'Gets a user by their nickname. Casing and spaces are igonred, so "Player One", "playerone" and "PLAYERONE" would all match the same user.',
  })
  @ResponseSchema({
    schema: GET_USER_SCHEMA,
  })
  async getByNickname(@Param('nickname') nickname: string): Promise<GetUserResult> {
    return this.userService.getByNickname(nickname)
  }

  @Get('ranking')
  @ApiOperation({
    summary: 'Get leaderboard',
    description: 'Gets the top 10 ranked players',
  })
  @ResponseSchema({
    schema: LIST_USERS_SCHEMA,
  })
  async getLeaderboard(): Promise<ListUsersResult> {
    return this.userService.getLeaderboard()
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ResponseSchema({
    description: 'Successfully retrieved user profile.',
    schema: GET_USER_SCHEMA,
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
  @ApiOperation({
    summary: 'Update nickname',
    description:
      'Changes the nickname of the currently authenticated user. Nickname can only be changed every 30 days.',
  })
  @BodySchema({
    schema: z.object({
      nickname: NICKNAME_SCHEMA,
    }),
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async changeNickname(
    @UserId() userId: number,
    @Body() { nickname }: ChangeNicknameCommand
  ): Promise<void> {
    await this.userService.changeNickname(userId, nickname)
  }

  @Get('me/icons')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List user icons',
    description: 'Returns a list with the ids of all icons available for the user.',
  })
  @ResponseSchema({
    schema: z.array(z.int()).describe('List of available icon IDs for the user'),
  })
  @ApiBearerAuth()
  async getIcons(@UserId() id: number): Promise<number[]> {
    return this.userService.getAvailableIcons(id)
  }

  @Patch('me/icon')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update summoner icon' })
  @BodySchema({
    schema: z.object({
      iconId: z.int().describe('ID of the new summoner icon to be set for the user'),
    }),
  })
  @ApiBearerAuth()
  async changeIcon(@UserId() id: number, @Body() { iconId }: ChangeIconCommand): Promise<void> {
    await this.userService.changeIcon(id, iconId)
  }
}
