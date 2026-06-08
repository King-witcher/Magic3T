import z from 'zod'

/**
 * Boundary schema for a registration password. Strength is no longer validated
 * here by length/character rules — it is evaluated server-side in
 * {@link PasswordService} (see AuthService.register). This only enforces basic
 * safety bounds: non-empty and a max length to avoid abuse / slow hashing.
 */
export const PASSWORD_SCHEMA = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password must be at most 128 characters long')

/** Body schema for the `POST /auth/password-strength` endpoint. */
export const PASSWORD_STRENGTH_SCHEMA = z.object({
  password: z.string().min(1).max(128).describe('The candidate password to evaluate'),
  inputs: z.array(z.string().max(128)).max(10).describe('User inputs (username, nickname, ...)'),
  hash: z.string().length(8),
})
