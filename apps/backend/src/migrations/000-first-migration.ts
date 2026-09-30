import { Injectable } from '@nestjs/common'
import { IDbClient, sql } from '@/shared/database'
import { RuntimeMigration } from '../infra/migrations/runtime-migration'

@Injectable()
export class FirstMigration extends RuntimeMigration {
  name = '000-first-migration'
  async up(client: IDbClient): Promise<void> {
    await client.query(sql`SELECT 1`)
  }
}
