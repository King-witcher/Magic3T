import {
  DatabaseError as PgDatabaseError,
  PoolClient,
  QueryConfig,
  QueryConfigValues,
  QueryResultRow,
} from 'pg'
import { DatabaseError } from './database-error'

export interface IDbClient {
  query<R extends QueryResultRow, I = any>(queryConfig: QueryConfig<I>): Promise<R[]>
  query<R extends QueryResultRow, I = any>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<R[]>
}

/** Encapsulates a PoolClient and provides a better error type. */
export class DbClient implements IDbClient {
  constructor(private readonly client: PoolClient) {}

  async query<R extends QueryResultRow, I = any>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<R[]> {
    try {
      const result = await this.client.query<R, I>(queryTextOrConfig, values)
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
