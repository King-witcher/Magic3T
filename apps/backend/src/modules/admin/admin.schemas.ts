import z from 'zod'
import { NICKNAME_SCHEMA } from '@/shared/validation'

/** Client-facing leagues (a subset of the database league enum). */
const CLIENT_LEAGUES = ['bronze', 'silver', 'gold', 'diamond', 'master', 'challenger'] as const
const APEX_LEAGUES: readonly string[] = ['master', 'challenger']

/** Query parameters for the admin user listing. Values arrive as strings and are coerced. */
export const LIST_USERS_QUERY_SCHEMA = z.object({
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['nickname', 'createdAt', 'elo']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

/**
 * Validates a rank, mirroring the database `rank_shape_consistency` constraint:
 * placement (all null) OR apex (no division, lp set) OR non-apex (division 1-4, lp 0-99).
 */
const RANK_SCHEMA = z
  .object({
    league: z.enum(CLIENT_LEAGUES).nullable(),
    division: z.number().int().min(1).max(4).nullable(),
    lp: z.number().int().min(0).nullable(),
  })
  .superRefine((rank, ctx) => {
    if (rank.league === null) {
      if (rank.division !== null || rank.lp !== null) {
        ctx.addIssue({ code: 'custom', message: 'Placement rank must have null division and lp' })
      }
      return
    }

    if (APEX_LEAGUES.includes(rank.league)) {
      if (rank.division !== null) {
        ctx.addIssue({ code: 'custom', message: 'Apex leagues must not have a division' })
      }
      if (rank.lp === null) {
        ctx.addIssue({ code: 'custom', message: 'Apex leagues require lp' })
      }
      return
    }

    if (rank.division === null) {
      ctx.addIssue({ code: 'custom', message: 'Non-apex leagues require a division' })
    }
    if (rank.lp === null || rank.lp > 99) {
      ctx.addIssue({ code: 'custom', message: 'Non-apex lp must be between 0 and 99' })
    }
  })

/** Body schema for editing a user. Every field is optional; only present fields are updated. */
export const UPDATE_USER_SCHEMA = z
  .object({
    nickname: NICKNAME_SCHEMA.optional(),
    summonerIcon: z.number().int().min(0).optional(),
    role: z.enum(['bot', 'player', 'admin', 'superuser']).optional(),
    rank: RANK_SCHEMA.optional(),
    credits: z.number().int().min(0).optional(),
    xp: z.number().int().min(0).optional(),
    stats: z
      .object({
        wins: z.number().int().min(0),
        draws: z.number().int().min(0),
        defeats: z.number().int().min(0),
      })
      .optional(),
  })
  .strict()

// ---------------------------------------------------------------------------
// Response schemas (used by @ResponseSchema for the Swagger documentation).
// ---------------------------------------------------------------------------

const ROLE_ENUM_SCHEMA = z.enum(['bot', 'player', 'admin', 'superuser'])

const RANK_RESULT_SCHEMA = z.object({
  league: z.enum(CLIENT_LEAGUES).nullable(),
  division: z.number().int().gte(1).lte(4).nullable(),
  lp: z.number().int().nullable(),
})

const ADMIN_USER_LIST_ITEM_SCHEMA = z.object({
  id: z.uuid(),
  nickname: z.string(),
  summonerIcon: z.number().int(),
  role: ROLE_ENUM_SCHEMA,
  email: z.string().nullable(),
  rank: RANK_RESULT_SCHEMA,
  mmrScore: z.number(),
  createdAt: z.string(),
})

export const LIST_USERS_RESULT_SCHEMA = z.object({
  data: z.array(ADMIN_USER_LIST_ITEM_SCHEMA),
  nextCursor: z.string().nullable(),
  total: z.number().int().nullable(),
})

export const ADMIN_USER_DETAIL_SCHEMA = z.object({
  id: z.uuid(),
  nickname: z.string(),
  summonerIcon: z.number().int(),
  role: ROLE_ENUM_SCHEMA,
  email: z.string().nullable(),
  credits: z.number().int(),
  xp: z.number().int(),
  rank: RANK_RESULT_SCHEMA,
  mmrScore: z.number(),
  mmrKFactor: z.number(),
  rankMatches: z.number().int(),
  stats: z.object({
    wins: z.number().int(),
    draws: z.number().int(),
    defeats: z.number().int(),
  }),
  ownedIcons: z.array(z.number().int()),
  createdAt: z.string(),
  nicknameChangedAt: z.string(),
})

const ICON_RARITY_SCHEMA = z.enum([
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'ultimate',
  'exalted',
  'transcendent',
])

export const LIST_ICONS_RESULT_SCHEMA = z.object({
  data: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      description: z.string().nullable(),
      yearReleased: z.number().int().nullable(),
      rarity: ICON_RARITY_SCHEMA,
      isLegacy: z.boolean(),
    })
  ),
})
