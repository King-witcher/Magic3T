import type { ClientRank } from '@magic3t/common-types'
import type { user_role } from '@magic3t/database-types'

export type GetUserResult = {
  id: string
  nickname: string
  summonerIcon: number
  role: user_role
  rating: ClientRank
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
  rating: ClientRank
  role: user_role
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
