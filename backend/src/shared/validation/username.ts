import z from 'zod'

export const USERNAME_REGEX = /^[a-zA-Z0-9]*$/
export const USERNAME_SCHEMA = z
  .string()
  .max(16)
  .min(4)
  .regex(USERNAME_REGEX, 'Username can only contain letters and numbers')
