import {
  RegisterFirebaseCommand,
  RegisterFirebaseResponse,
  SignInFirebaseCommand,
  SignInFirebaseResponse,
  ValidateSessionResponse,
} from '@magic3t/api-types'
import { BaseApiClient } from '../base-api-client'

export class AuthApiClient extends BaseApiClient<'auth'> {
  constructor() {
    super('auth')
  }

  /**
   * Validates the current session and returns the associated user session data, if registered. If the session is valid but the user is not registered, it returns null. Otherwise, it throws an error.
   */
  validateSession(signal?: AbortSignal): Promise<ValidateSessionResponse> {
    return this.get('validate-session', {
      signal,
      authenticated: true,
    })
  }

  /**
   * Registers a user using a Firebase token, returning a session ID and user profile on success.
   */
  registerFirebase(
    command: RegisterFirebaseCommand,
    signal?: AbortSignal
  ): Promise<RegisterFirebaseResponse> {
    return this.post('register/firebase', command, {
      signal,
    })
  }

  /**
   * Signs in a user using a Firebase token, returning a session ID and user profile on success.
   */
  signInFirebase(
    command: SignInFirebaseCommand,
    signal?: AbortSignal
  ): Promise<SignInFirebaseResponse> {
    return this.post('sign-in/firebase', command, {
      signal,
    })
  }
}
