import z from 'zod'

export const signInFirebaseSchema = z.object({
  token: z.string().max(2000).describe('Firebase ID token obtained from the client'),
})
