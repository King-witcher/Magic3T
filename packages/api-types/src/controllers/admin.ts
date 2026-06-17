import { ClientRank, UserRole } from '@magic3t/common-types'
import { IconRarityEnum } from '@magic3t/database-types'

export namespace Admin {
  /** Column used to sort the admin user listing. */
  export type ListUsersSort = 'nickname' | 'createdAt' | 'elo'

  export type ListUsersOrder = 'asc' | 'desc'

  /** Query parameters accepted by the admin user listing endpoint. */
  export type ListUsersQuery = {
    /** Free text search matching nickname or user UUID. */
    search?: string
    sort?: ListUsersSort
    order?: ListUsersOrder
    /** Opaque keyset cursor pointing to the item after which results should continue. */
    cursor?: string
    limit?: number
  }

  /** A single user as shown in the admin listing. */
  export type AdminUserListItem = {
    id: string
    nickname: string
    summonerIcon: number
    role: UserRole
    email: string | null
    rank: ClientRank
    mmrScore: number
    createdAt: string
  }

  export type ListUsersResult = {
    data: AdminUserListItem[]
    /** Cursor to fetch the next page, or null when there are no more results. */
    nextCursor: string | null
    /** Total number of matches; only returned on the first page (null afterwards). */
    total: number | null
  }

  /** Full user information shown on the admin detail/edit screen. */
  export type AdminUserDetail = {
    id: string
    nickname: string
    summonerIcon: number
    role: UserRole
    email: string | null
    credits: number
    xp: number
    rank: ClientRank
    mmrScore: number
    mmrKFactor: number
    rankMatches: number
    stats: {
      wins: number
      draws: number
      defeats: number
    }
    /** Ids of the icons the user can use (base icons plus any granted ones). */
    ownedIcons: number[]
    createdAt: string
    nicknameChangedAt: string
  }

  /** A single game summoner icon as shown in the admin icon picker. */
  export type IconCatalogueItem = {
    id: number
    title: string
    description: string | null
    yearReleased: number | null
    rarity: IconRarityEnum
    isLegacy: boolean
  }

  export type ListIconsResult = {
    data: IconCatalogueItem[]
  }

  /** Patch payload for editing a user from the admin panel. Only present fields are updated. */
  export type UpdateUserCommand = {
    nickname?: string
    summonerIcon?: number
    /** Only superusers are allowed to change roles. */
    role?: UserRole
    rank?: ClientRank
    credits?: number
    xp?: number
    stats?: {
      wins: number
      draws: number
      defeats: number
    }
  }
}
