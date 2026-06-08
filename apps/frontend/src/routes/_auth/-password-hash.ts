/** Length of the base64-truncated anti-abuse signature (last 8 chars). */
const SIGNATURE_LENGTH = 8

/**
 * Shared anti-abuse key, embedded in the frontend bundle. This is NOT a real
 * secret (anyone can read the bundle) — it only deters casual third-party calls
 * to the password-strength endpoint.
 */
const SECRET = import.meta.env.VITE_PASSWORD_STRENGTH_SECRET ?? ''

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
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const message = JSON.stringify([password, ...inputs])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))

  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return base64.slice(-SIGNATURE_LENGTH)
}
