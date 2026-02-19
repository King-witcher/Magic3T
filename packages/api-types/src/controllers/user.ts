import type { RatingData } from '@magic3t/common-types'
import type { UserRole } from '@magic3t/database-types'
import type { BanInfo } from './admin'

export type GetUserResult = {
  id: string
  nickname: string
  summonerIcon: number
  role: UserRole
  rating: RatingData
  ban?: BanInfo
  stats: {
    wins: number
    draws: number
    defeats: number
  }
}

export type ListUsersResultData = {
  id: string
  nickname: string
  summonerIcon: number
  rating: RatingData
  role: UserRole
}

export type ListUsersResult = {
  data: ListUsersResultData[]
}

export type RegisterUserCommand = {
  nickname: string
}

export type ChangeNicknameCommand = {
  nickname: string
}

export type ChangeIconCommand = {
  iconId: number
}
