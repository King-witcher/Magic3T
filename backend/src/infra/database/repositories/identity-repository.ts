import { LegacyUserIdentityRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'

@Injectable()
export class IdentityRepository {
  private logger = new Logger(IdentityRepository.name, { timestamp: true })
  constructor(private readonly databaseService: DatabaseService) {}

  async findByFirebaseId(firebaseId: string): Promise<LegacyUserIdentityRow | null> {
    const [result] = await this.databaseService.query<LegacyUserIdentityRow>(sql`
      SELECT * FROM legacy_user_identities WHERE firebase_id = ${firebaseId}
    `)
    return result ?? null
  }
}
