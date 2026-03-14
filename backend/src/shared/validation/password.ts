import z from 'zod'

export const PASSWORD_SCHEMA = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .regex(/[a-zA-Z]+/, 'Password must contain at least one letter')
  .regex(/[0-9]+/, 'Password must contain at least one number')
