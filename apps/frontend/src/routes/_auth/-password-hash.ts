/** Length of the base64-truncated anti-abuse signature (last 8 chars). */
const SIGNATURE_LENGTH = 8

/**
 * Shared key used to sign requests to `POST /auth/password-strength`. Kept
 * hardcoded and IDENTICAL to the backend copy in
 * apps/backend/src/modules/auth/password.service.ts. It ships in this bundle,
 * so it is only an anti-abuse deterrent, not a real secret.
 */
const PASSWORD_STRENGTH_SECRET = 'c5cf22e07f589950877e0340ecbea5159c0e6a7857837ecbe1df07b3a26a5188'

/**
 * Computes the signature expected by `POST /auth/password-strength`.
 *
 * Must stay in sync with the backend
 * (apps/backend/src/modules/auth/password.service.ts): the last 8 base64 chars
 * of `HMAC-SHA256(secret, JSON.stringify([password, ...inputs]))`.
 */
export async function computePasswordStrengthHash(
  password: string,
  inputs: string[]
): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PASSWORD_STRENGTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const message = JSON.stringify([password, ...inputs])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))

  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return base64.slice(-SIGNATURE_LENGTH)
}
