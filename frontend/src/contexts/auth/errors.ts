import { AuthErrorCode } from '@magic3t/api-types'
import { captureException } from '@sentry/react'
import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes } from 'firebase/auth'
import { ClientError } from '@/services/clients'

type FirebaseAuthErrorCode = (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes]

export const enum OAuthErrorCode {
  PopupClosed = 'PopupClosed',
  PopupBlocked = 'PopupBlocked',
  NetworkError = 'NetworkError',
  AccountDisabled = 'AccountDisabled',
  InvalidCredential = 'InvalidCredential',
  Unknown = 'Unknown',
}

const FIREBASE_ERROR_MAP: Partial<Record<FirebaseAuthErrorCode, OAuthErrorCode>> = {
  // 'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': OAuthErrorCode.AccountDisabled,
  // 'auth/user-not-found': 'No account found with this email.',
  // 'auth/wrong-password': 'Incorrect password. Please try again.',
  // 'auth/account-exists-with-different-credential':
  //   'An account already exists with the same email address but different sign-in credentials.',
  'auth/cancelled-popup-request': OAuthErrorCode.PopupClosed,
  'auth/popup-closed-by-user': OAuthErrorCode.PopupClosed,
  // 'auth/weak-password': 'The password is too weak. Please choose a stronger password.',
  // 'auth/email-already-in-use': 'The email address is already in use by another account.',
  // 'auth/missing-password': 'Password is required.',
  'auth/network-request-failed': OAuthErrorCode.NetworkError,
  'auth/popup-blocked': OAuthErrorCode.PopupBlocked,
  'auth/invalid-credential': OAuthErrorCode.InvalidCredential,
}

// Represents errors thrown by AuthContext
export type AuthContextErrorCode = `OAuth::${OAuthErrorCode}` | `Api::${AuthErrorCode}` | 'Unknown'

export class AuthError extends Error {
  constructor(public readonly errorCode: AuthContextErrorCode) {
    super(`Authentication error: ${errorCode}`)
    this.name = errorCode
  }
}

// Converts various error types into an AuthError, mapping known error codes and capturing unknown errors with Sentry.
export async function toAuthError(error: unknown): Promise<never> {
  if (error instanceof AuthError) {
    throw error
  }

  if (error instanceof ClientError) {
    const code = (await error.errorCode) as AuthErrorCode | null
    switch (code) {
      case AuthErrorCode.InvalidCredentials:
      case AuthErrorCode.NicknameUnavailable:
      case AuthErrorCode.UsernameUnavailable:
      case AuthErrorCode.UserAlreadyRegistered:
        throw new AuthError(`Api::${code}`)
      default:
        captureException(error)
        throw new AuthError(`Api::Unknown`)
    }
  }

  if (error instanceof FirebaseError) {
    const code = error.code as FirebaseAuthErrorCode
    const mapped = FIREBASE_ERROR_MAP[code] ?? OAuthErrorCode.Unknown
    throw new AuthError(`OAuth::${mapped}`)
  }

  captureException(error)
  throw new AuthError('Unknown')
}
