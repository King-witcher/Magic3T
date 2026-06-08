import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  MIN_PASSWORD_SCORE,
  PasswordScore,
  PasswordStrengthCommand,
  PasswordStrengthFeedback,
  PasswordStrengthResult,
} from '@magic3t/api-types'
import { HttpStatus, Injectable } from '@nestjs/common'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import { adjacencyGraphs, dictionary as commonDictionary } from '@zxcvbn-ts/language-common'
import { dictionary as enDictionary, translations } from '@zxcvbn-ts/language-en'
import { respondError, unexpected } from '@/common'

/** Length of the base64-truncated anti-abuse signature (last 8 chars). */
const SIGNATURE_LENGTH = 8

@Injectable()
export class PasswordService {
  constructor() {
    // zxcvbn is configured once with the english + common dictionaries so that
    // password evaluation penalizes common words, names and keyboard patterns.
    zxcvbnOptions.setOptions({
      translations,
      graphs: adjacencyGraphs,
      dictionary: {
        ...commonDictionary,
        ...enDictionary,
      },
    })
  }

  /**
   * Evaluates a password, penalizing the provided user inputs
   * (username, nickname, ...). Returns the strength score and feedback.
   */
  evaluate(
    password: string,
    inputs: string[]
  ): { score: PasswordScore; feedback: PasswordStrengthFeedback } {
    const result = zxcvbn(password, inputs)
    return {
      score: result.score as PasswordScore,
      feedback: {
        warning: result.feedback.warning ?? '',
        suggestions: result.feedback.suggestions ?? [],
      },
    }
  }

  /** Whether a score is strong enough to be accepted on registration. */
  isAcceptable(score: PasswordScore): boolean {
    return score >= MIN_PASSWORD_SCORE
  }

  /**
   * Validates the anti-abuse signature and returns the password strength.
   * Throws `403 InvalidSignature` when the signature does not match, so the
   * endpoint cannot be called by third parties without the shared key.
   */
  checkStrength(command: PasswordStrengthCommand): PasswordStrengthResult {
    const { password, inputs, hash } = command

    if (!this.verifySignature(password, inputs, hash)) {
      respondError('InvalidSignature', HttpStatus.FORBIDDEN, 'Invalid request signature')
    }

    const { score, feedback } = this.evaluate(password, inputs)
    return { score, acceptable: this.isAcceptable(score), feedback }
  }

  /**
   * Recomputes the expected signature from the password and inputs and compares
   * it (in constant time) with the one sent by the client.
   */
  private verifySignature(password: string, inputs: string[], hash: string): boolean {
    if (hash.length !== SIGNATURE_LENGTH) return false
    const expected = this.computeSignature(password, inputs)
    return timingSafeEqual(Buffer.from(hash), Buffer.from(expected))
  }

  /**
   * `HMAC-SHA256(secret, JSON.stringify([password, ...inputs]))` encoded as
   * base64, keeping only the last 8 chars. Must stay in sync with the frontend
   * implementation (apps/frontend/src/routes/_auth/-password-hash.ts).
   */
  private computeSignature(password: string, inputs: string[]): string {
    const secret = process.env.PASSWORD_STRENGTH_SECRET
    if (!secret) unexpected('PASSWORD_STRENGTH_SECRET is not configured')

    const message = JSON.stringify([password, ...inputs])
    return createHmac('sha256', secret).update(message).digest('base64').slice(-SIGNATURE_LENGTH)
  }
}
