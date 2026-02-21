import { RatingData } from '@magic3t/common-types'
import { UserRow } from '@magic3t/database-types'

export namespace Admin {
  export type ListAccountsResultItem = {
    id: string
  } & (
    | {
        userRow: UserRow
        rating: RatingData
      }
    | {
        userRow: null
        rating: null
      }
  )

  export type ListAccountsResult = {
    users: ListAccountsResultItem[]
  }
}
