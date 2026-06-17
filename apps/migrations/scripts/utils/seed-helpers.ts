import { randomBytes } from 'node:crypto'
import type { PoolClient } from 'pg'

/**
 * Small toolbox shared by the dev seed script. Kept dependency-free (only `pg`
 * and node built-ins) so it lives comfortably inside the migrations workspace.
 */

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

/** Inclusive integer in [min, max]. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Float in [min, max). */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/** Picks a random element. Caller guarantees the array is non-empty. */
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

/** Weighted pick. `weights[i]` is the relative weight of `items[i]`. */
export function weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] as number
    if (r <= 0) return items[i] as T
  }
  return items[items.length - 1] as T
}

// ---------------------------------------------------------------------------
// UUIDv7
// ---------------------------------------------------------------------------

/**
 * Builds an RFC 9562 UUIDv7 whose embedded millisecond timestamp equals `ts`.
 *
 * The `match` table derives its `date` column from `uuid_extract_timestamp(uuid)`
 * (PostgreSQL 18), so to backdate a match we must hand-craft the UUID instead of
 * relying on the `uuidv7()` column default (which would stamp "now").
 */
export function uuidV7(ts: number): string {
  const bytes = Buffer.alloc(16)
  const t = BigInt(ts)
  bytes[0] = Number((t >> 40n) & 0xffn)
  bytes[1] = Number((t >> 32n) & 0xffn)
  bytes[2] = Number((t >> 24n) & 0xffn)
  bytes[3] = Number((t >> 16n) & 0xffn)
  bytes[4] = Number((t >> 8n) & 0xffn)
  bytes[5] = Number(t & 0xffn)

  randomBytes(10).copy(bytes, 6)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70 // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variant 10

  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// ---------------------------------------------------------------------------
// Bulk insert
// ---------------------------------------------------------------------------

type BulkInsertOptions = {
  /** e.g. `'ON CONFLICT (id) DO NOTHING'`. */
  conflict?: string
  /** e.g. `'id'` or `'id, uuid'`. Rows come back in VALUES order. */
  returning?: string
}

const PG_MAX_PARAMS = 60_000

/**
 * Multi-row parameterized INSERT, automatically chunked to stay under the
 * PostgreSQL bind-parameter limit. When `returning` is set, the rows are
 * returned in insertion order (concatenated across chunks), which the seed
 * relies on to map generated ids back onto in-memory objects.
 */
export async function bulkInsert<R = unknown>(
  client: PoolClient,
  table: string,
  columns: readonly string[],
  rows: ReadonlyArray<Record<string, unknown>>,
  options: BulkInsertOptions = {}
): Promise<R[]> {
  if (rows.length === 0) return []

  const colList = columns.map((c) => `"${c}"`).join(', ')
  const conflict = options.conflict ? ` ${options.conflict}` : ''
  const returning = options.returning ? ` RETURNING ${options.returning}` : ''
  const rowsPerChunk = Math.max(1, Math.floor(PG_MAX_PARAMS / columns.length))

  const result: R[] = []
  for (let start = 0; start < rows.length; start += rowsPerChunk) {
    const chunk = rows.slice(start, start + rowsPerChunk)
    const values: unknown[] = []
    const tuples = chunk.map((row, i) => {
      const placeholders = columns.map((col, j) => {
        values.push(row[col] ?? null)
        return `$${i * columns.length + j + 1}`
      })
      return `(${placeholders.join(', ')})`
    })
    const text = `INSERT INTO ${table} (${colList}) VALUES ${tuples.join(', ')}${conflict}${returning}`
    const res = await client.query(text, values)
    result.push(...(res.rows as R[]))
  }
  return result
}
