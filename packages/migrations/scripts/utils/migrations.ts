import { readdir, readFile } from 'node:fs/promises'
import { sql } from './db'

export type SqlScript = {
  migrationName: string
  sql: string
}

export const MIGRATIONS_DIR = 'sql'

/** Lists all migration names in the migrations directory */
export async function listMigrationNames(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR, {
    withFileTypes: true,
  })

  const dirs = entries.filter((file) => file.isDirectory()).map((file) => file.name)

  const result = dirs.sort((a, b) => a.localeCompare(b))
  return result
}

export async function getMigrationSql(
  fullName: string,
  type: 'up' | 'down' = 'up'
): Promise<SqlScript | null> {
  try {
    const file = await readFile(`${MIGRATIONS_DIR}/${fullName}/${type}.sql`, 'utf-8')
    return {
      migrationName: fullName,
      sql: file,
    }
  } catch (_error) {
    const error = _error as NodeJS.ErrnoException
    // File not found
    if (error.code === 'ENOENT') return null

    console.error(`❌ Failed to read ${type} migration file for ${fullName}.`)
    throw error
  }
}

/** Creates the migrations table if it doesn't exist */
export async function createTableMigrationsIfNotExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations
    (
        id             SMALLINT GENERATED ALWAYS AS IDENTITY,
        name           TEXT                     NOT NULL,
        applied_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        rolled_back_at TIMESTAMP WITH TIME ZONE
    );
  `
}

/** Lists all applied migrations */
export async function listAppliedMigrations() {
  console.info('📋 Fetching applied migrations from the database...')
  const rows = await sql<{ name: string }>`
    SELECT DISTINCT name
    FROM _migrations
    WHERE rolled_back_at IS NULL
  `
  return rows.map((row) => row.name)
}
