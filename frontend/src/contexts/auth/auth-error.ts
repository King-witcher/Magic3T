import { AuthErrorCode } from '@magic3t/api-types'

export class AuthError extends Error {
  name = 'AuthError'

  constructor(public readonly errorCode: AuthErrorCode) {
    super(`Authentication error: ${errorCode}`)
  }
}
