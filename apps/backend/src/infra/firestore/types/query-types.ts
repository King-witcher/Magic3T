export type GetResult<T> = {
  id: string
  createdAt: Date
  updatedAt: Date
  data: T
}

export type ListResult<T> = GetResult<T>[]
