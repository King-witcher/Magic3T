/** biome-ignore-all lint/suspicious/noExplicitAny: I don't know a better way to do that */
import {
  DatabaseError as PgDatabaseError,
  PoolClient,
  QueryConfig,
  QueryConfigValues,
  QueryResultRow,
} from 'pg'
import { DatabaseError } from './database-error'

export interface IDbClient {
  query<TRow extends QueryResultRow = any, TParams = any>(
    queryConfig: QueryConfig<TParams>
  ): Promise<TRow[]>
  query<TRow extends QueryResultRow = any, TParams = any>(
    queryTextOrConfig: string | QueryConfig<TParams>,
    values?: QueryConfigValues<TParams>
  ): Promise<TRow[]>
}

/** Encapsulates a PoolClient and provides a better error type. */
export class DbClient implements IDbClient {
  constructor(private readonly client: PoolClient) {}

  async query<TRow extends QueryResultRow, TParams = unknown>(
    queryTextOrConfig: string | QueryConfig<TParams>,
    values?: QueryConfigValues<TParams>
  ): Promise<TRow[]> {
    try {
      const result = await this.client.query<TRow, TParams>(queryTextOrConfig, values)
      return result.rows
    } catch (error) {
      if (error instanceof PgDatabaseError) {
        throw new DatabaseError(
          error,
          typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text
        )
      }
      throw error
    }
  }

  release() {
    this.client.release()
  }
}
