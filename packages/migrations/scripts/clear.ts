import { close, transaction } from './utils/db'
import {
  getMigrationSql,
  listAppliedMigrations,
  listMigrationNames,
  type SqlScript,
} from './utils/migrations'

async function listDownMigrations(): Promise<SqlScript[]> {
  console.info('📂 Listing migration files...')
  const names = await listMigrationNames()
  const migrations = await Promise.all(
    names.map(async (name) => {
      const migration = await getMigrationSql(name, 'down')
      if (!migration) throw new Error(`Missing down.sql file for migration: ${name}`)
      return migration
    })
  )
  return migrations
}

async function main(): Promise<number> {
  try {
    const allRollbacks = (await listDownMigrations()).reverse()
    const applied = await listAppliedMigrations()
    const appliedSet = new Set(applied)
    const pendingRollbacks = allRollbacks.filter((migration) =>
      appliedSet.has(migration.migrationName)
    )

    if (pendingRollbacks.length === 0) {
      console.info('❌ No migrations to rollback.')
      return 1
    }

    console.info(`📃 Found ${pendingRollbacks.length} migration(s) to rollback.`)

    await transaction(async (conn) => {
      for (const rollback of pendingRollbacks) {
        try {
          console.info(`📄 Rolling back migration: ${rollback.migrationName}...`)
          await conn.query(rollback.sql)
          await conn.query(
            `
            UPDATE _migration
            SET rolled_back_at = NOW()
            WHERE name = $1
            AND rolled_back_at IS NULL
          `,
            [rollback.migrationName]
          )
        } catch (error) {
          console.error(`❌ Failed to rollback migration: ${rollback.migrationName}`)
          throw error
        }
      }
    })

    console.info('✅ Migrations rolled back successfully.')
  } catch (error) {
    console.error('❌ Rollback failed:', (error as Error).message)
    return 1
  } finally {
    await close()
  }
  return 0
}

process.exit(await main())
