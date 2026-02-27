import { close, transaction } from './utils/db'
import {
  createTableMigrationsIfNotExists,
  getMigrationSql,
  listAppliedMigrations,
  listMigrationNames,
  type SqlScript,
} from './utils/migrations'

async function listUpMigrations(): Promise<SqlScript[]> {
  console.info('📂 Listing migration files...')
  const names = await listMigrationNames()
  const migrations = await Promise.all(
    names.map(async (name) => {
      const migration = await getMigrationSql(name, 'up')
      if (!migration) throw new Error(`Missing up.sql file for migration: ${name}`)
      return migration
    })
  )
  return migrations
}

async function main(): Promise<number> {
  try {
    const [migrations] = await Promise.all([listUpMigrations(), createTableMigrationsIfNotExists()])

    const applied = await listAppliedMigrations()
    const appliedSet = new Set(applied)
    const pending = migrations.filter((migration) => !appliedSet.has(migration.migrationName))

    if (pending.length === 0) {
      console.info('✅ No pending migrations. Database is up to date.')
      return 0
    }

    console.info(`📃 Found ${pending.length} pending migration(s).`)

    await transaction(async (client) => {
      for (const migration of pending) {
        try {
          console.info(`📄 Applying migration: ${migration.migrationName}...`)
          await client.query(migration.sql)
        } catch (error) {
          console.error(`❌ Failed to apply migration: ${migration.migrationName}`)
          console.error('📄 Rolling back...')
          throw error
        }
        await client.query(
          `
          INSERT INTO _migrations (name)
          VALUES ($1)
        `,
          [migration.migrationName]
        )
      }
    })

    console.info('✅ Migrations applied successfully.')
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message)
    return 1
  } finally {
    await close()
  }
  return 0
}

process.exit(await main())
