import {
  LoginCommand,
  LoginResult,
  RegisterCommand,
  RegisterFirebaseCommand,
  RegisterFirebaseResponse,
  RegisterResult,
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
    return this.get('session', {
      signal,
      authenticated: true,
    })
  }

  /**
   * Registers a user using a Firebase token, returning a session ID and user profile on success.
   */
  registerFromFirebase(command: RegisterFirebaseCommand): Promise<RegisterFirebaseResponse> {
    return this.post('firebase/register', command)
  }

  /**
   * Signs in a user using a Firebase token, returning a session ID and user profile on success.
   */
  signInFirebase(command: SignInFirebaseCommand): Promise<SignInFirebaseResponse> {
    return this.post('firebase/login', command)
  }

  /**
   * Logins a user with a username and password. Returns a session ID and user profile on success.
   */
  login(command: LoginCommand): Promise<LoginResult> {
    return this.post('login', command)
  }

  /** Registers a user with credentials */
  register(command: RegisterCommand): Promise<RegisterResult> {
    return this.post('register', command)
  }

  /** Deletes the current user session, effectively logging out the user. */
  logout(): Promise<void> {
    return this.post('logout', undefined, {
      authenticated: true,
    })
  }
}
