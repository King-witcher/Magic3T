import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { Pool, PoolClient, QueryConfig, QueryConfigValues } from 'pg'

@Injectable()
export class DatabaseService {
  private readonly pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.PG_HOST,
      port: Number.parseInt(process.env.PG_PORT, 10),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxLifetimeSeconds: 60,
      ssl: process.env.PG_HOST !== 'localhost',
    })
  }

  query<T>(text: string, values?: unknown[]): Promise<T[]>
  query<T>(params: { text: string; values: unknown[] }): Promise<T[]>
  async query<T, I>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<T[]> {
    const result = await this.pool.query(queryTextOrConfig, values)
    return result.rows
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      return Promise.reject(error)
    } finally {
      client.release()
    }
  }
}
