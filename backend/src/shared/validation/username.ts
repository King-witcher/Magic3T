import z from 'zod'

export const USERNAME_SCHEMA = z
  .string()
  .max(16, 'Username must be at most 16 characters long')
  .min(4, 'Username must be at least 4 characters long')
  .regex(/^[a-zA-Z0-9]*$/, 'Username can only contain letters and numbers')
