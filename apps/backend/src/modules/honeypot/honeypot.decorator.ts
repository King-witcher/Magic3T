import { SetMetadata } from '@nestjs/common'

export const HONEYPOT_KEY = 'HONEYPOT'

/** Marks a route or controller as a honeypot. Any IP that reaches it gets banned. */
export function Honeypot() {
  return SetMetadata(HONEYPOT_KEY, true)
}
