import { Inject, Injectable, Logger } from '@nestjs/common'
import { DatabaseService } from '@/infra/database'
import { IDbClient, sql } from '@/shared/database'
import { RUNTIME_MIGRATIONS_KEY, RuntimeMigration } from './runtime-migration'

const LOCK_KEY = 1

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name, { timestamp: true })
  private migrations: RuntimeMigration[]

  constructor(
    @Inject(RUNTIME_MIGRATIONS_KEY) migrations: RuntimeMigration[],
    private databaseService: DatabaseService
  ) {
    this.migrations = [...migrations].sort((a, b) => a.name.localeCompare(b.name))
  }

  async run() {
    const applied = await this.listApplied(this.databaseService)
    const pending = this.migrations.filter((m) => !applied.has(m.name))

    for (const migration of pending) {
      await this.apply(migration)
    }
    this.logger.log('Runtime migrations ran')
  }

  async apply(migration: RuntimeMigration): Promise<boolean> {
    return await this.databaseService.transaction(async (client) => {
      await client.query(sql`SELECT pg_advisory_xact_lock(${LOCK_KEY})`)

      // Another instance may have already run while we waited for the lock
      const applied = await this.listApplied(client)
      if (applied.has(migration.name)) return false

      this.logger.log(`Applying runtime migration ${migration.name}`)
      await migration.up(client)
      await client.query(sql`INSERT INTO _runtime_migration (name) VALUES (${migration.name})`)
      this.logger.log(`Applied runtime migration ${migration.name}`)

      return true
    })
  }

  async listApplied(client: IDbClient): Promise<Set<string>> {
    const applied = await client.query<{ name: string }>(sql`
      SELECT name FROM _runtime_migration;
    `)
    return new Set(applied.map((a) => a.name))
  }
}
