import { UserRole } from '@magic3t/common-types'

export type RegisterFirebaseCommand = {
  token: string
  data: {
    nickname: string
  }
}

export type RegisterFirebaseResponse = {
  sessionId: string
  profile: {
    uuid: string
    nickname: string
    summonerIcon: number
    role: UserRole
  }
}
