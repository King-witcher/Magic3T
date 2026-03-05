import { Injectable } from '@nestjs/common'
import { DatabaseError as PgDatabaseError, Pool, QueryConfig, QueryConfigValues } from 'pg'
import { DbClient, IDbClient } from '@/shared/database/db-client'
import { DatabaseError } from '../../shared/database/database-error'

@Injectable()
export class DatabaseService implements IDbClient {
  private readonly pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.PG_HOST,
      port: Number.parseInt(process.env.PG_PORT, 10),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      maxLifetimeSeconds: 60,
      max: 20,
    })
  }

  query<T>(text: string, values?: unknown[]): Promise<T[]>
  query<T>(params: { text: string; values: unknown[] }): Promise<T[]>
  async query<T, I>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<T[]> {
    try {
      const result = await this.pool.query(queryTextOrConfig, values)
      return result.rows
    } catch (error) {
      if (error instanceof PgDatabaseError) {
        return Promise.reject(
          new DatabaseError(
            error,
            typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text
          )
        )
      }
      return Promise.reject(error)
    }
  }

  async transaction<T>(callback: (client: DbClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    const dbClient = new DbClient(client)

    try {
      await dbClient.query('BEGIN')
      const result = await callback(dbClient)
      await dbClient.query('COMMIT')
      return result
    } catch (error) {
      await dbClient.query('ROLLBACK')
      throw error
    } finally {
      dbClient.release()
    }
  }
}
