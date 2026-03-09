import { UserRole } from '@magic3t/common-types'

export type ErrorResponse<T extends string = string> = {
  errorCode: T
  metadata?: unknown
}

export type ApiNamespace = 'admin' | 'auth' | 'match' | 'queue' | 'user' | undefined

export type ClientSessionData = {
  uuid: string
  nickname: string
  summonerIcon: number
  role: UserRole
}

export type OAuthProvider = 'firebase'
