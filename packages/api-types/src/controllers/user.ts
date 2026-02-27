import type { RatingData } from '@magic3t/common-types'
import type { UserDocumentRole } from '@magic3t/database-types'

export type GetUserResult = {
  id: string
  nickname: string
  summonerIcon: number
  role: UserDocumentRole
  rating: RatingData
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
  role: UserDocumentRole
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
