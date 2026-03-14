import { AuthContextErrorCode } from '@/contexts/auth'

export const ERROR_MAP: Record<AuthContextErrorCode, string> = {
  'Api::InvalidCredentials': 'Incorrect username or password.',
  'Api::NicknameUnavailable': 'This nickname is unavailable.',
  'Api::UsernameUnavailable': 'This username is unavailable.',
  'Api::UserAlreadyRegistered': 'This account is already registered.',
  'Api::Unknown': 'An unknown API error occurred during authentication.',
  'OAuth::PopupClosed':
    'The authentication popup was closed before completing the sign-in process.',
  'OAuth::PopupBlocked':
    'The authentication popup was blocked by the browser. Please allow popups and try again.',
  'OAuth::NetworkError':
    'A network error occurred during authentication. Please check your connection and try again.',
  'OAuth::AccountDisabled': 'This account has been disabled.',
  'OAuth::InvalidCredential': 'The provided credentials are invalid. Please try again.',
  'OAuth::Unknown': 'An unknown OAuth error occurred during authentication.',
  Unknown: 'An unexpected error occurred. Please try again later.',
}
