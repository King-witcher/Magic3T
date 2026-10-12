import {
  LoginCommand,
  LoginResult,
  PasswordStrengthCommand,
  PasswordStrengthResult,
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
    })
  }

  registerFromFirebase(command: RegisterFirebaseCommand): Promise<RegisterFirebaseResponse> {
    return this.post('firebase/register', command)
  }

  signInFirebase(command: SignInFirebaseCommand): Promise<SignInFirebaseResponse> {
    return this.post('firebase/login', command)
  }

  login(command: LoginCommand): Promise<LoginResult> {
    return this.post('login', command)
  }

  register(command: RegisterCommand): Promise<RegisterResult> {
    return this.post('register', command)
  }

  /** Evaluates the strength of a password (signed with the shared anti-abuse key). */
  passwordStrength(
    command: PasswordStrengthCommand,
    signal?: AbortSignal
  ): Promise<PasswordStrengthResult> {
    return this.post('password-strength', command, { signal })
  }

  logout(): Promise<void> {
    return this.post('logout', undefined)
  }
}
