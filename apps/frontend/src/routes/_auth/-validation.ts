import z from 'zod'

export const USERNAME_SCHEMA = z
  .string()
  .max(16, 'Username must be at most 16 characters long')
  .min(4, 'Username must be at least 4 characters long')
  .regex(/^[a-zA-Z0-9]*$/, 'Username can only contain letters and numbers')

export const PASSWORD_SCHEMA = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .regex(/[a-zA-Z]+/, 'Password must contain at least one letter')
  .regex(/[0-9]+/, 'Password must contain at least one number')
  .describe('Password for the new account')

export const NICKNAME_SCHEMA = z
  .string()
  .max(16, 'Nickname must be at most 16 characters long')
  .min(4, 'Nickname must be at least 4 characters long')
  .regex(
    /^[a-zA-Z0-9áÁâÂãÃàÀäÄéÉêÊèÈëËíÍîÎìÌïÏóÓôÔõÕòÒöÖúÚûÛùÙüÜçÇñÑ\s]*$/,
    'Nickname can only contain letters, numbers and spaces'
  )
