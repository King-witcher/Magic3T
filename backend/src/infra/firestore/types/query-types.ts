/**
 * Represents the result of getting a single row from the database.
 */
export type GetResult<T> = {
  id: string
  createdAt: Date
  updatedAt: Date
  data: T
}

/**
 * Represents the result of getting multiple rows from the database.
 */
export type ListResult<T> = GetResult<T>[]
