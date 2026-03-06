import type { UserRole } from '@magic3t/common-types'

export type SignInFirebaseCommand = {
  token: string
}

export type SignInFirebaseResponse = {
  sessionId: string
  profile: {
    uuid: string
    nickname: string
    summonerIcon: number
    role: UserRole
  }
}
