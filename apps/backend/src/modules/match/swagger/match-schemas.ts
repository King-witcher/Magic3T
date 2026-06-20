import z from 'zod'

/** A team's rank as shown to the client. All fields are null while in placement. */
const CLIENT_RANK_SCHEMA = z.object({
  league: z
    .enum(['bronze', 'silver', 'gold', 'diamond', 'master', 'challenger'])
    .nullable()
    .describe('League tier, or null while the player is in placement'),
  division: z.int().gte(1).lte(4).nullable().describe('Division within the league (1-4)'),
  lp: z.int().nullable().describe('League points'),
})

/** One of the two sides of a match, with the player and their result. */
const MATCH_TEAM_SCHEMA = z.object({
  uuid: z.string().nullable().describe('The player UUID, or null for a bot'),
  nickname: z.string().describe("The player's nickname"),
  rank: CLIENT_RANK_SCHEMA,
  lpGain: z.int().nullable().describe('LP gained (or lost) in this match, or null if unranked'),
  score: z.number().describe('The score this team achieved in the match'),
})

/** A single event that happened during a match, in chronological order. */
const MATCH_EVENT_SCHEMA = z.discriminatedUnion('event', [
  z.object({
    event: z.enum(['forfeit', 'timeout']).describe('A player forfeited or ran out of time'),
    team: z.enum(['order', 'chaos']).describe('The team that triggered the event'),
    time: z.number().describe('Milliseconds elapsed since the match started'),
  }),
  z.object({
    event: z.literal('choice').describe('A player picked a number'),
    team: z.enum(['order', 'chaos']).describe('The team that made the choice'),
    time: z.number().describe('Milliseconds elapsed since the match started'),
    choice: z.int().gte(1).lte(9).describe('The number (1-9) that was picked'),
  }),
])

/** Full detail of a single match, including every event. */
export const GET_MATCH_SCHEMA = z.object({
  uuid: z.uuid().describe('Unique identifier of the match'),
  order: MATCH_TEAM_SCHEMA.describe('The Order team'),
  chaos: MATCH_TEAM_SCHEMA.describe('The Chaos team'),
  events: z
    .array(MATCH_EVENT_SCHEMA)
    .describe('Chronological list of events (choices, forfeits, timeouts) that happened'),
  winner: z.enum(['order', 'chaos']).nullable().describe('The winning team, or null for a draw'),
  date: z.iso.datetime().describe('When the match was played (ISO 8601)'),
})

/** A match as it appears in a user's match history (summary, without the event list). */
const LIST_MATCHES_ITEM_SCHEMA = z.object({
  uuid: z.uuid().describe('Unique identifier of the match'),
  order: MATCH_TEAM_SCHEMA.describe('The Order team'),
  chaos: MATCH_TEAM_SCHEMA.describe('The Chaos team'),
  winner: z.enum(['order', 'chaos']).nullable().describe('The winning team, or null for a draw'),
  date: z.iso.datetime().describe('When the match was played (ISO 8601)'),
})

/** A page of a user's recent matches, sorted by date (most recent first). */
export const LIST_MATCHES_SCHEMA = z.object({
  matches: z.array(LIST_MATCHES_ITEM_SCHEMA).describe('The recent matches, most recent first'),
})
