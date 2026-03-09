import z from 'zod'

export const getUserResultSchema = z.object({
  uuid: z.uuid(),
  nickname: z.string(),
  summonerIcon: z.int(),
  role: z.enum(['bot', 'player', 'admin', 'superuser']),
  rank: z.object({
    league: z.enum(['provisional', 'bronze', 'silver', 'gold', 'diamond', 'master', 'challenger']),
    division: z.int().gte(1).lte(4).nullable(),
    points: z.int().nullable(),
    rankedCount: z.int(),
  }),
  stats: z.object({
    wins: z.int(),
    draws: z.int(),
    defeats: z.int(),
  }),
})
