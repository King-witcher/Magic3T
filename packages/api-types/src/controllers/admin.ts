import { ClientRank } from '@magic3t/common-types'
import { UserDocument } from '@magic3t/database-types'

export namespace Admin {
  export type ListAccountsResultItem = {
    id: string
    metadata: {
      lastSignInTime: string
      creationTime: string
      lastRefreshTime: string | null
    }
    accountData: {
      displayName: string
      email: string
    }
  } & (
    | {
        userRow: UserDocument
        rating: ClientRank
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
