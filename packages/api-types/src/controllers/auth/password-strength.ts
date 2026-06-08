/**
 * Minimum score (0-4) required for a password to be accepted on
 * registration. Shared between the backend (server-side gate on /auth/register)
 * and the frontend (enabling the submit button / showing feedback) so both
 * agree on the same threshold.
 */
export const MIN_PASSWORD_SCORE = 2

/** strength score, from 0 (weakest) to 4 (strongest). */
export type PasswordScore = 0 | 1 | 2 | 3 | 4

export type PasswordStrengthCommand = {
  /** The candidate password to evaluate. */
  password: string
  /**
   * User-provided terms (username, nickname, ...) that are penalized when
   * found inside the password.
   */
  inputs: string[]
  /**
   * Anti-abuse signature.
   */
  hash: string
}

export type PasswordStrengthFeedback = {
  /** A short warning about the password, or an empty string when there is none. */
  warning: string
  /** Actionable suggestions to make the password stronger. */
  suggestions: string[]
}

export type PasswordStrengthResult = {
  /** The score, from 0 (weakest) to 4 (strongest). */
  score: PasswordScore
  /** Whether the score meets {@link MIN_PASSWORD_SCORE} and would be accepted. */
  acceptable: boolean
  /** Human-readable feedback to help the user improve the password. */
  feedback: PasswordStrengthFeedback
}
