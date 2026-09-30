import { Injectable } from '@nestjs/common'
import { IconRepository } from '@/infra/database/repositories'
import { IDbClient } from '@/shared/database'
import { RuntimeMigration } from '../infra/migrations/runtime-migration'

//** Syncs local database with Riot Games icons before first bootstrap */
@Injectable()
export class SyncIcons extends RuntimeMigration {
  name = '2026-09-29-sync-icons'

  constructor(private iconRepository: IconRepository) {
    super()
  }

  async up(client: IDbClient): Promise<void> {
    await this.iconRepository.syncIcons(client)
  }
}
