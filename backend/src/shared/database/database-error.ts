import { DatabaseError as PgDatabaseError } from 'pg'

export class DatabaseError extends Error {
  constructor(
    error: PgDatabaseError,
    public sql?: string,
    public values?: any[]
  ) {
    super(error.message, { cause: error })
    this.name = `DatabaseError::${error.name}`
  }

  get cause(): PgDatabaseError {
    return super.cause as PgDatabaseError
  }

  get code() {
    const cause = this.cause
    return cause.code
  }
}
