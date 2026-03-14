import z from 'zod'

export const NICKNAME_SCHEMA = z
  .string()
  .max(16, 'Nickname must be at most 16 characters long')
  .min(4, 'Nickname must be at least 4 characters long')
  .regex(
    /^[a-zA-Z0-9áÁâÂãÃàÀäÄéÉêÊèÈëËíÍîÎìÌïÏóÓôÔõÕòÒöÖúÚûÛùÙüÜçÇñÑ\s]*$/,
    'Nickname can only contain letters, numbers and spaces'
  )
