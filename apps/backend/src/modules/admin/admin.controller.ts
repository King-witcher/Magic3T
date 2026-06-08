import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { IconRepository } from '@/infra/database/repositories/icon-repository'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { AuthGuard } from '../auth'
import { AdminGuard } from './admin.guard'

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly userRepository: UserRepository,
    private iconRepository: IconRepository
  ) {}

  @ApiOperation({
    summary: 'Sync Icons',
    description: 'Fetches the latest icons from Riot API and updates the local database.',
  })
  @Post('sync-icons')
  async syncIcons() {
    await this.iconRepository.syncIcons()
  }

  @ApiOperation({
    summary: 'Import users from Firebase',
    description: 'Imports user data from Firebase into the local database.',
  })
  @Post('import-users')
  async importUsers() {
    await this.userRepository.importFromFirebase()
  }
}
