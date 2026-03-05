import type { UserRole } from '@magic3t/common-types'
import type { OAuthProvider } from '../common'

export namespace AuthNamespace {
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

  export type SignInOAuthCommand = {
    provider: OAuthProvider
    token: string
  }

  export type SignInOAuthResponse = {
    /** Tells whether the provided token is valid or not. */
    validToken: boolean

    /** Tells whether the user is registered or not in the database. */
    registered: boolean

    /** The session id. Only provided if the token is valid and the user is registered. */
    sessionId: string | null
  }

  export type RegisterOAuthCommand = {
    provider: OAuthProvider
    token: string
    data: {
      nickname: string
    }
  }

  export type RegisterOAuthResponse = {
    error: string | null
    sessionId: string | null
  }

  export type SignOutCommand = string
}
