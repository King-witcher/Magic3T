import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import type { PoolClient } from 'pg'
import { close, transaction } from './utils/db'
import { type GameEvent, generateGame, type Team } from './utils/seed-game'
import { bulkInsert, pick, randFloat, randInt, uuidV7 } from './utils/seed-helpers'
import {
  getExpectedResult,
  INITIAL_K_FACTOR,
  type League,
  MMR_LP_RATIO,
  PLACEMENT_MATCHES_REQUIRED,
  type RatingFields,
  rankFromMmr,
  updateMmrOnly,
} from './utils/seed-rating'

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

/** Ordinary ranked players (excludes the special admin/mod/bot accounts). */
const PLAYER_COUNT = 60
/** Ranked matches to simulate. ~2 snapshots are produced per match. */
const MATCH_COUNT = 1100
/** Players intentionally left in placements (rank still provisional). */
const NEWBIE_COUNT = 4
/** Simulation window: matches are spread over the last N days. */
const WINDOW_DAYS = 60

/** Shared dev password for every seeded credential (incl. admin). */
const DEV_PASSWORD = 'asdf'
const BCRYPT_ROUNDS = 12

/** Valid DigitalDragon profile-icon ids to seed (getIconUrl maps id -> image). */
const ICON_IDS = Array.from({ length: 50 }, (_, i) => i) // 0..49 (29 is the default)
const ICON_RARITIES = [
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'ultimate',
  'exalted',
  'transcendent',
] as const

// ---------------------------------------------------------------------------
// In-memory simulation model
// ---------------------------------------------------------------------------

type Role = 'player' | 'admin' | 'superuser' | 'bot'

type SimSnapshot = {
  id?: number // filled in after insert
  user: SimUser
  league: League | null
  division: number | null
  lp: number | null
  matches: number
  mmr_score: number
  mmr_k_factor: number
  date: Date
}

type SimUser = RatingFields & {
  id?: string // uuid, filled in after insert
  nickname: string
  slug: string
  role: Role
  iconId: number
  ownedIcons: number[]
  credits: number
  xp: number
  createdAt: Date
  username: string | null // credential username (null = no login)
  // simulation-only state
  latent: number // hidden "true skill" driving outcomes
  maxGames: number
  gamesPlayed: number
  victories: number
  draws: number
  defeats: number
  snapshots: SimSnapshot[]
  latestSnapshot: SimSnapshot | null
}

type SimMatch = {
  id?: number
  uuid: string
  date: Date
  order: SimUser
  chaos: SimUser
  orderScore: number
  winner: Team | null
  orderOld: SimSnapshot | null
  chaosOld: SimSnapshot | null
  orderLpGain: number | null
  chaosLpGain: number | null
  orderTimeSpent: number
  chaosTimeSpent: number
  events: GameEvent[]
}

// ---------------------------------------------------------------------------
// Nickname generation
// ---------------------------------------------------------------------------

const ADJECTIVES = [
  'Swift',
  'Shadow',
  'Iron',
  'Lunar',
  'Vortex',
  'Crimson',
  'Frost',
  'Neon',
  'Cyber',
  'Astro',
  'Mystic',
  'Rogue',
  'Blaze',
  'Storm',
  'Echo',
  'Zen',
  'Solar',
  'Void',
  'Hyper',
  'Onyx',
  'Jade',
  'Pixel',
  'Turbo',
  'Quantum',
]
const NOUNS = [
  'Fox',
  'Wolf',
  'Hawk',
  'Sage',
  'Knight',
  'Ninja',
  'Mage',
  'Drake',
  'Raven',
  'Tiger',
  'Comet',
  'Phantom',
  'Golem',
  'Viper',
  'Owl',
  'Falcon',
  'Lynx',
  'Cobra',
  'Titan',
  'Ghost',
  'Wisp',
  'Rook',
  'Bishop',
  'Jester',
]

/** Builds `count` unique, space-free nicknames of at most 16 chars. */
function makeNicknames(count: number, taken: Set<string>): string[] {
  const out: string[] = []
  while (out.length < count) {
    let name = `${pick(ADJECTIVES)}${pick(NOUNS)}`
    if (Math.random() < 0.5) name += randInt(1, 999)
    name = name.slice(0, 16)
    const slug = name.toLowerCase()
    if (taken.has(slug)) continue
    taken.add(slug)
    out.push(name)
  }
  return out
}

// ---------------------------------------------------------------------------
// Build the population
// ---------------------------------------------------------------------------

function randomIcons(): { profile: number; owned: number[] } {
  const profile = pick(ICON_IDS)
  const owned = new Set<number>([profile])
  const extra = randInt(2, 7)
  while (owned.size < extra + 1) owned.add(pick(ICON_IDS))
  return { profile, owned: [...owned] }
}

function freshRating(createdAt: Date, startMmr: number): RatingFields {
  return {
    mmr_score: startMmr,
    mmr_k_factor: INITIAL_K_FACTOR,
    rank_league: null,
    rank_division: null,
    rank_lp: null,
    rank_matches: 0,
    rank_date: createdAt,
  }
}

function buildPopulation(now: number): { users: SimUser[]; players: SimUser[] } {
  const windowStart = now - WINDOW_DAYS * 86_400_000
  const takenSlugs = new Set<string>()
  const users: SimUser[] = []

  const makeUser = (
    nickname: string,
    role: Role,
    opts: { latent: number; username: string | null; maxGames: number }
  ): SimUser => {
    const createdAt = new Date(windowStart - randInt(1, 25) * 86_400_000)
    const { profile, owned } = randomIcons()
    return {
      nickname,
      slug: nickname.toLowerCase(),
      role,
      iconId: profile,
      ownedIcons: owned,
      credits: randInt(0, 8000),
      xp: randInt(0, 75_000),
      createdAt,
      username: opts.username,
      latent: opts.latent,
      maxGames: opts.maxGames,
      gamesPlayed: 0,
      victories: 0,
      draws: 0,
      defeats: 0,
      snapshots: [],
      latestSnapshot: null,
      ...freshRating(createdAt, opts.latent + randFloat(-40, 40)),
    }
  }

  // Special accounts.
  takenSlugs.add('admin')
  takenSlugs.add('mod')
  users.push(
    makeUser('admin', 'superuser', { latent: 2080, username: 'admin', maxGames: Infinity })
  )
  users.push(makeUser('Mod', 'admin', { latent: 1820, username: 'mod', maxGames: Infinity }))

  // Ordinary players: latent skill (= starting MMR) spread evenly across the
  // whole ladder, so rank — derived from MMR — covers Bronze through Challenger.
  // A random handful are left provisional (fewer than 5 ranked matches).
  const nicknames = makeNicknames(PLAYER_COUNT, takenSlugs)
  const newbies = new Set<number>()
  while (newbies.size < NEWBIE_COUNT) newbies.add(randInt(0, PLAYER_COUNT - 1))
  for (let i = 0; i < PLAYER_COUNT; i++) {
    const nickname = nicknames[i]!
    const t = PLAYER_COUNT > 1 ? i / (PLAYER_COUNT - 1) : 0.5
    const latent = Math.round(1300 + t * 1150 + randFloat(-70, 70)) // ~1300..2450
    users.push(
      makeUser(nickname, 'player', {
        latent,
        username: nickname.toLowerCase(),
        maxGames: newbies.has(i) ? randInt(0, PLACEMENT_MATCHES_REQUIRED - 1) : Infinity,
      })
    )
  }

  // A couple of bot accounts for role coverage (never enter the ranked pool).
  for (let i = 1; i <= 2; i++) {
    users.push(makeUser(`Botzin${i}`, 'bot', { latent: 1500, username: null, maxGames: 0 }))
  }

  const players = users.filter((u) => u.role !== 'bot' && u.maxGames > 0)
  return { users, players }
}

// ---------------------------------------------------------------------------
// Match simulation
// ---------------------------------------------------------------------------

function decideOutcome(order: SimUser, chaos: SimUser): Team | 'draw' {
  if (Math.random() < 0.07) return 'draw'
  const pOrderWin = getExpectedResult(order.latent, chaos.latent)
  return Math.random() < pOrderWin ? 'order' : 'chaos'
}

/**
 * Picks two distinct, still-eligible players. Pairing is deliberately *random*
 * (not MMR-matchmade): random opponents let skill express itself in the score,
 * so MMR — and therefore rank — spreads across the whole ladder. MMR matchmaking
 * pins every expectation near 0.5 and collapses the distribution toward 1500.
 */
function pickPair(players: SimUser[]): [SimUser, SimUser] | null {
  const eligible = players.filter((p) => p.gamesPlayed < p.maxGames)
  if (eligible.length < 2) return null
  const a = pick(eligible)
  const b = pick(eligible.filter((p) => p !== a))
  // Randomize which side is "order".
  return Math.random() < 0.5 ? [a, b] : [b, a]
}

function simulate(
  players: SimUser[],
  now: number
): { matches: SimMatch[]; snapshots: SimSnapshot[] } {
  const windowStart = now - WINDOW_DAYS * 86_400_000
  const span = now - windowStart
  const matches: SimMatch[] = []
  const snapshots: SimSnapshot[] = []

  for (let i = 0; i < MATCH_COUNT; i++) {
    const pair = pickPair(players)
    if (!pair) break
    const [order, chaos] = pair

    // Chronological timestamp (slightly jittered, kept strictly increasing).
    const base = windowStart + Math.floor((i / MATCH_COUNT) * span)
    const ts = Math.min(now - 1, base + randInt(0, Math.floor(span / MATCH_COUNT)))
    const date = new Date(ts)

    const game = generateGame(decideOutcome(order, chaos))

    // Old-rating snapshots = each player's latest snapshot *before* this match.
    const orderOld = order.latestSnapshot
    const chaosOld = chaos.latestSnapshot

    // Raw MMR update (Elo), then rank derived straight from the new MMR.
    const matchesBeforeOrder = order.rank_matches
    const matchesBeforeChaos = chaos.rank_matches
    const [orderMmrDelta, chaosMmrDelta] = updateMmrOnly(order, chaos, game.orderScore)
    const orderLpGain = applyRank(order, matchesBeforeOrder, orderMmrDelta, date)
    const chaosLpGain = applyRank(chaos, matchesBeforeChaos, chaosMmrDelta, date)

    order.gamesPlayed++
    chaos.gamesPlayed++
    if (game.winner === 'order') {
      order.victories++
      chaos.defeats++
    } else if (game.winner === 'chaos') {
      order.defeats++
      chaos.victories++
    } else {
      order.draws++
      chaos.draws++
    }

    const orderSnap = takeSnapshot(order, date)
    const chaosSnap = takeSnapshot(chaos, date)
    snapshots.push(orderSnap, chaosSnap)

    matches.push({
      uuid: uuidV7(ts),
      date,
      order,
      chaos,
      orderScore: game.orderScore,
      winner: game.winner,
      orderOld,
      chaosOld,
      orderLpGain,
      chaosLpGain,
      orderTimeSpent: game.orderTimeSpent,
      chaosTimeSpent: game.chaosTimeSpent,
      events: game.events,
    })
  }

  return { matches, snapshots }
}

/**
 * Advances a player's match count and re-derives their rank from the new MMR.
 * Returns the LP gain to display for the match (null while in placements).
 */
function applyRank(
  user: SimUser,
  matchesBefore: number,
  mmrDelta: number,
  date: Date
): number | null {
  user.rank_matches = matchesBefore + 1
  user.rank_date = date
  const rank = rankFromMmr(user.mmr_score, user.rank_matches)
  user.rank_league = rank.league
  user.rank_division = rank.division
  user.rank_lp = rank.lp
  if (matchesBefore < PLACEMENT_MATCHES_REQUIRED) return null
  const lp = Math.round(mmrDelta * MMR_LP_RATIO)
  return Math.max(-32000, Math.min(32000, lp))
}

/** Records the player's current rating as a snapshot and makes it their latest. */
function takeSnapshot(user: SimUser, date: Date): SimSnapshot {
  const snap: SimSnapshot = {
    user,
    league: user.rank_league,
    division: user.rank_division,
    lp: user.rank_lp,
    matches: user.rank_matches,
    mmr_score: user.mmr_score,
    mmr_k_factor: user.mmr_k_factor,
    date,
  }
  user.snapshots.push(snap)
  user.latestSnapshot = snap
  return snap
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function persist(
  client: PoolClient,
  users: SimUser[],
  snapshots: SimSnapshot[],
  matches: SimMatch[],
  passwordDigest: string
): Promise<void> {
  // 1. Wipe seedable tables (CASCADE clears matches, snapshots, credentials...).
  await client.query(
    `TRUNCATE TABLE match_event, match, user_rating_snapshot, user_credential,
       user_icon, user_identity, legacy_user_identity, "user" RESTART IDENTITY CASCADE`
  )

  // 2. Icons (preserve any real icon sync via ON CONFLICT DO NOTHING).
  await bulkInsert(
    client,
    'icon',
    ['id', 'title', 'description', 'year_released', 'content_id', 'is_legacy', 'rarity'],
    ICON_IDS.map((id, i) => ({
      id,
      title: `Summoner Icon ${id}`,
      description: null,
      year_released: null,
      content_id: randomUUID(),
      is_legacy: false,
      rarity: ICON_RARITIES[i % ICON_RARITIES.length],
    })),
    { conflict: 'ON CONFLICT (id) DO NOTHING' }
  )

  // 3. Users — capture generated ids (returned in insertion order).
  const userIds = await bulkInsert<{ id: string }>(
    client,
    '"user"',
    [
      'role',
      'credits',
      'xp',
      'profile_nickname',
      'profile_nickname_slug',
      'profile_nickname_date',
      'profile_icon',
      'mmr_score',
      'mmr_k_factor',
      'rank_league',
      'rank_division',
      'rank_lp',
      'rank_matches',
      'rank_date',
      'stats_victories',
      'stats_draws',
      'stats_defeats',
      'created_at',
    ],
    users.map((u) => ({
      role: u.role,
      credits: u.credits,
      xp: u.xp,
      profile_nickname: u.nickname,
      profile_nickname_slug: u.slug,
      profile_nickname_date: u.createdAt,
      profile_icon: u.iconId,
      mmr_score: u.mmr_score,
      mmr_k_factor: u.mmr_k_factor,
      rank_league: u.rank_league,
      rank_division: u.rank_division,
      rank_lp: u.rank_lp,
      rank_matches: u.rank_matches,
      rank_date: u.rank_date,
      stats_victories: u.victories,
      stats_draws: u.draws,
      stats_defeats: u.defeats,
      created_at: u.createdAt,
    })),
    { returning: 'id' }
  )
  users.forEach((u, i) => {
    u.id = userIds[i]!.id
  })

  // 4. Rating snapshots — capture ids so matches can reference the "old" rating.
  const snapIds = await bulkInsert<{ id: number }>(
    client,
    'user_rating_snapshot',
    ['user_id', 'league', 'division', 'lp', 'matches', 'mmr_score', 'mmr_k_factor', 'date'],
    snapshots.map((s) => ({
      user_id: s.user.id,
      league: s.league,
      division: s.division,
      lp: s.lp,
      matches: s.matches,
      mmr_score: s.mmr_score,
      mmr_k_factor: s.mmr_k_factor,
      date: s.date,
    })),
    { returning: 'id' }
  )
  snapshots.forEach((s, i) => {
    s.id = snapIds[i]!.id
  })

  // 5. Matches (insert oldest-first so match.id tracks chronology).
  const ordered = [...matches].sort((a, b) => a.date.getTime() - b.date.getTime())
  const matchIds = await bulkInsert<{ id: number }>(
    client,
    'match',
    [
      'uuid',
      'order_id',
      'order_nickname',
      'order_match_score',
      'order_old_rating',
      'order_lp_gain',
      'order_time_spent',
      'chaos_id',
      'chaos_nickname',
      'chaos_old_rating',
      'chaos_lp_gain',
      'chaos_time_spent',
      'winner',
    ],
    ordered.map((m) => ({
      uuid: m.uuid,
      order_id: m.order.id,
      order_nickname: m.order.nickname,
      order_match_score: m.orderScore,
      order_old_rating: m.orderOld?.id ?? null,
      order_lp_gain: m.orderLpGain,
      order_time_spent: m.orderTimeSpent,
      chaos_id: m.chaos.id,
      chaos_nickname: m.chaos.nickname,
      chaos_old_rating: m.chaosOld?.id ?? null,
      chaos_lp_gain: m.chaosLpGain,
      chaos_time_spent: m.chaosTimeSpent,
      winner: m.winner,
    })),
    { returning: 'id' }
  )
  ordered.forEach((m, i) => {
    m.id = matchIds[i]!.id
  })

  // 6. Match events.
  const eventRows = ordered.flatMap((m) =>
    m.events.map((e) => ({
      match_id: m.id,
      sequence: e.sequence,
      time_ms: e.time_ms,
      type: e.type,
      team: e.team,
      choice: e.choice,
    }))
  )
  await bulkInsert(
    client,
    'match_event',
    ['match_id', 'sequence', 'time_ms', 'type', 'team', 'choice'],
    eventRows
  )

  // 7. Credentials (username/password login). All share the dev password.
  const credUsers = users.filter((u) => u.username)
  await bulkInsert(
    client,
    'user_credential',
    ['username_slug', 'user_id', 'algorithm', 'password_digest'],
    credUsers.map((u) => ({
      username_slug: u.username,
      user_id: u.id,
      algorithm: 'bcrypt',
      password_digest: passwordDigest,
    }))
  )

  // 8. Owned icons (so the profile icon grid / store have data).
  const iconRows = users.flatMap((u) =>
    u.ownedIcons.map((iconId) => ({
      user_id: u.id,
      icon_id: iconId,
      granted_at: new Date(u.createdAt.getTime() + randInt(0, WINDOW_DAYS) * 86_400_000),
    }))
  )
  await bulkInsert(client, 'user_icon', ['user_id', 'icon_id', 'granted_at'], iconRows, {
    conflict: 'ON CONFLICT (user_id, icon_id) DO NOTHING',
  })
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function reportDistribution(players: SimUser[]): void {
  const order: (League | 'provisional')[] = [
    'challenger',
    'master',
    'diamond',
    'gold',
    'silver',
    'bronze',
    'provisional',
  ]
  const counts = new Map<string, number>()
  for (const u of players) {
    const key = u.rank_league ?? 'provisional'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  console.info('🏆 Rank distribution:')
  for (const league of order) {
    const n = counts.get(league) ?? 0
    if (n > 0) console.info(`   ${league.padEnd(12)} ${n}`)
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  try {
    console.info('🌱 Seeding development data...')
    const now = Date.now()

    const { users, players } = buildPopulation(now)
    console.info(`👥 Built ${users.length} users (${players.length} active in the ranked pool).`)

    const { matches, snapshots } = simulate(players, now)
    console.info(`🎮 Simulated ${matches.length} matches → ${snapshots.length} rating snapshots.`)

    console.info('🔐 Hashing dev password...')
    const passwordDigest = await bcrypt.hash(DEV_PASSWORD, BCRYPT_ROUNDS)

    await transaction((client) => persist(client, users, snapshots, matches, passwordDigest))

    console.info('✅ Seed complete.')
    reportDistribution(players)
    console.info('')
    console.info('🔑 Logins (all use password "asdf"):')
    console.info('   admin / asdf   → superuser')
    console.info('   mod   / asdf   → admin')
    console.info('   ...or any player nickname (lowercased) / asdf')
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { code?: string }
    if (err.code === '42P01') {
      console.error('❌ Tables are missing. Run "npm run migrate" first, then re-run the seed.')
    } else {
      console.error('❌ Seed failed:', (error as Error).message)
    }
    return 1
  } finally {
    await close()
  }
  return 0
}

process.exit(await main())
