import type { ClientRank, UserRole } from '@magic3t/common-types'

export type GetUserResult = {
  id: string
  nickname: string
  summonerIcon: number
  role: UserRole
  rank: ClientRank
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
  rank: ClientRank
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
