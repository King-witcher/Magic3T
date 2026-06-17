import { Admin } from '@magic3t/api-types'
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { BodySchema, ResponseSchema, ZodBodyValidationPipe, ZodValidationPipe } from '@/common'
import { IconRepository } from '@/infra/database/repositories/icon-repository'
import { Session } from '@/modules/auth'
import { SessionData } from '@/shared/types/session-data'
import { AuthGuard } from '../auth'
import { AdminGuard } from './admin.guard'
import {
  ADMIN_USER_DETAIL_SCHEMA,
  LIST_ICONS_RESULT_SCHEMA,
  LIST_USERS_QUERY_SCHEMA,
  LIST_USERS_RESULT_SCHEMA,
  UPDATE_USER_SCHEMA,
} from './admin.schemas'
import { AdminUserService } from './admin-user.service'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    // private readonly userRepository: UserRepository,
    private readonly iconRepository: IconRepository,
    private readonly adminUserService: AdminUserService
  ) {}

  @ApiOperation({
    summary: 'Sync Icons',
    description: 'Fetches the latest icons from Riot API and updates the local database.',
  })
  @Post('sync-icons')
  async syncIcons() {
    await this.iconRepository.syncIcons()
  }

  // @ApiOperation({
  //   summary: 'Import users from Firebase',
  //   description: 'Imports user data from Firebase into the local database.',
  // })
  // @Post('import-users')
  // async importUsers() {
  //   await this.userRepository.importFromFirebase()
  // }

  @ApiOperation({
    summary: 'List users',
    description:
      'Lists platform users with free-text search (nickname or UUID), sorting and pagination.',
  })
  @Get('users')
  @ResponseSchema({
    description: 'A page of users plus the cursor for the next page.',
    schema: LIST_USERS_RESULT_SCHEMA,
  })
  async listUsers(
    @Query(new ZodValidationPipe(LIST_USERS_QUERY_SCHEMA)) query: Admin.ListUsersQuery
  ): Promise<Admin.ListUsersResult> {
    return this.adminUserService.listUsers(query)
  }

  @ApiOperation({
    summary: 'Get user (admin)',
    description: 'Returns the full information of a user for the admin detail screen.',
  })
  @Get('users/:id')
  @ResponseSchema({
    description: 'The full user information.',
    schema: ADMIN_USER_DETAIL_SCHEMA,
  })
  async getUser(@Param('id') id: string): Promise<Admin.AdminUserDetail> {
    return this.adminUserService.getUser(id)
  }

  @ApiOperation({
    summary: 'List icons',
    description: 'Lists every game summoner icon, ordered by release date.',
  })
  @Get('icons')
  @ResponseSchema({
    description: 'The full icon catalogue.',
    schema: LIST_ICONS_RESULT_SCHEMA,
  })
  async listIcons(): Promise<Admin.ListIconsResult> {
    return this.adminUserService.listIcons()
  }

  @ApiOperation({
    summary: 'Update user (admin)',
    description:
      'Updates a user from the admin panel. Only the provided fields are changed. Role changes require a superuser.',
  })
  @Patch('users/:id')
  @BodySchema({
    description: 'The fields to update. Every field is optional; only provided fields are changed.',
    schema: UPDATE_USER_SCHEMA,
  })
  @ResponseSchema({
    description: 'The updated user information.',
    schema: ADMIN_USER_DETAIL_SCHEMA,
  })
  async updateUser(
    @Param('id') id: string,
    @Body(new ZodBodyValidationPipe(UPDATE_USER_SCHEMA)) command: Admin.UpdateUserCommand,
    @Session() session: SessionData
  ): Promise<Admin.AdminUserDetail> {
    return this.adminUserService.updateUser(session.role, id, command)
  }
}
