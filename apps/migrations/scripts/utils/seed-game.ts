import { pick, randInt, shuffle } from './seed-helpers'

/**
 * Generates plausible Magic3T match event logs that are *consistent* with a
 * predetermined winner.
 *
 * Magic3T is the "15 game": players alternate picking distinct numbers 1-9
 * (order moves first) and win by holding three numbers that sum to 15 — exactly
 * the 8 lines of the 3x3 magic square. A win is only ever detected on the
 * chooser's own move, so the constructions below place the winner's triple so
 * it completes on their final move and make sure the loser never holds a
 * winning triple.
 */

export type Team = 'order' | 'chaos'

export type GameEvent = {
  sequence: number
  time_ms: number
  type: 'choice' | 'forfeit' | 'timeout'
  team: Team
  choice: number | null
}

export type GameResult = {
  winner: Team | null
  events: GameEvent[]
  orderTimeSpent: number
  chaosTimeSpent: number
  /** order's match score in [0,1]: 1 win, 0 loss, time-based on a draw. */
  orderScore: number
}

/** The 8 distinct triples of 1-9 summing to 15 (the magic-square lines). */
const WIN_TRIPLES: number[][] = [
  [1, 5, 9],
  [1, 6, 8],
  [2, 4, 9],
  [2, 5, 8],
  [2, 6, 7],
  [3, 4, 8],
  [3, 5, 7],
  [4, 5, 6],
]

const opposite = (team: Team): Team => (team === 'order' ? 'chaos' : 'order')

/** A precomputed cat's-game draw (5 order picks, 4 chaos, no triple either side). */
const DRAW_MOVES: { team: Team; choice: number }[] = [
  { team: 'order', choice: 2 },
  { team: 'chaos', choice: 7 },
  { team: 'order', choice: 6 },
  { team: 'chaos', choice: 1 },
  { team: 'order', choice: 9 },
  { team: 'chaos', choice: 4 },
  { team: 'order', choice: 5 },
  { team: 'chaos', choice: 8 },
  { team: 'order', choice: 3 },
]

const hasNoWinTriple = (nums: number[]): boolean =>
  !WIN_TRIPLES.some((t) => t.every((n) => nums.includes(n)))

/**
 * Builds a decisive game won "on the board" (a completed 15-triple).
 * `winner` picks a random triple; the loser gets non-winning numbers, and turn
 * order (order first) is preserved so the triple completes on the winner's last
 * move.
 */
function buildBoardWin(winner: Team): { team: Team; choice: number }[] {
  const triple = shuffle(pick(WIN_TRIPLES))
  const rest = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !triple.includes(n)))

  if (winner === 'order') {
    // O C O C O — order completes the triple on move 5; chaos picks 2 numbers.
    const l = rest.slice(0, 2)
    return [
      { team: 'order', choice: triple[0]! },
      { team: 'chaos', choice: l[0]! },
      { team: 'order', choice: triple[1]! },
      { team: 'chaos', choice: l[1]! },
      { team: 'order', choice: triple[2]! },
    ]
  }

  // winner === 'chaos': O C O C O C — chaos completes on move 6; order (loser)
  // takes 3 numbers that must NOT themselves be a winning triple.
  let loser = rest.slice(0, 3)
  for (let tries = 0; tries < 20 && !hasNoWinTriple(loser); tries++) {
    loser = shuffle(rest).slice(0, 3)
  }
  return [
    { team: 'order', choice: loser[0]! },
    { team: 'chaos', choice: triple[0]! },
    { team: 'order', choice: loser[1]! },
    { team: 'chaos', choice: triple[1]! },
    { team: 'order', choice: loser[2]! },
    { team: 'chaos', choice: triple[2]! },
  ]
}

/**
 * Builds a game decided by the loser forfeiting or timing out: a few harmless
 * choice moves, then the loser quits/times out on their turn.
 */
function buildAbandon(
  winner: Team,
  kind: 'forfeit' | 'timeout'
): { team: Team; choice: number | null; type: 'choice' | 'forfeit' | 'timeout' }[] {
  const loser = opposite(winner)
  // Choose how many opening choices so the next move belongs to the loser.
  const evenIsOrder = (n: number) => n % 2 === 0
  let count = randInt(0, 4)
  // After `count` choices the side to move is order when count is even.
  const wantOrderToMove = loser === 'order'
  if (evenIsOrder(count) !== wantOrderToMove) count = Math.max(0, count - 1)

  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const moves: { team: Team; choice: number | null; type: 'choice' | 'forfeit' | 'timeout' }[] = []
  let turn: Team = 'order'
  for (let i = 0; i < count; i++) {
    moves.push({ team: turn, choice: numbers[i]!, type: 'choice' })
    turn = opposite(turn)
  }
  moves.push({ team: loser, choice: null, type: kind })
  return moves
}

/**
 * Produces a full, valid event log for the requested outcome, with realistic
 * per-move think times scaled so `order + chaos` time fits the match table's
 * SMALLINT `total_time_spent` column.
 */
export function generateGame(outcome: Team | 'draw'): GameResult {
  let raw: { team: Team; choice: number | null; type: 'choice' | 'forfeit' | 'timeout' }[]
  let winner: Team | null

  if (outcome === 'draw') {
    winner = null
    raw = DRAW_MOVES.map((m) => ({ team: m.team, choice: m.choice, type: 'choice' as const }))
  } else {
    winner = outcome
    const style = Math.random()
    if (style < 0.18) raw = buildAbandon(outcome, 'forfeit')
    else if (style < 0.3) raw = buildAbandon(outcome, 'timeout')
    else raw = buildBoardWin(outcome).map((m) => ({ ...m, type: 'choice' as const }))
  }

  // Assign per-move think times, then scale to satisfy the SMALLINT total.
  const thinks = raw.map((m) => (m.type === 'choice' ? randInt(250, 3500) : randInt(400, 3000)))
  const orderRaw = thinks.reduce((s, t, i) => s + (raw[i]!.team === 'order' ? t : 0), 0)
  const chaosRaw = thinks.reduce((s, t, i) => s + (raw[i]!.team === 'chaos' ? t : 0), 0)
  const totalRaw = orderRaw + chaosRaw
  const MAX_TOTAL = 30_000
  const scale = totalRaw > MAX_TOTAL ? MAX_TOTAL / totalRaw : 1

  let cumulative = 0
  let orderTimeSpent = 0
  let chaosTimeSpent = 0
  const events: GameEvent[] = raw.map((m, i) => {
    const think = Math.max(1, Math.round(thinks[i]! * scale))
    cumulative += think
    if (m.team === 'order') orderTimeSpent += think
    else chaosTimeSpent += think
    return { sequence: i, time_ms: cumulative, type: m.type, team: m.team, choice: m.choice }
  })

  const orderScore =
    winner === 'order'
      ? 1
      : winner === 'chaos'
        ? 0
        : orderTimeSpent + chaosTimeSpent === 0
          ? 0.5
          : orderTimeSpent / (orderTimeSpent + chaosTimeSpent)

  return { winner, events, orderTimeSpent, chaosTimeSpent, orderScore }
}
