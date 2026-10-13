import { decide, evolve } from './decider'
import { MatchCommand, MatchEvent, MatchState } from './types'

export type MatchEventsListener = (events: MatchEvent[], state: MatchState) => void

export class MatchRoom {
  private state: MatchState
  private timeoutHandle?: NodeJS.Timeout
  private startedAt: number | null = null

  constructor(
    timelimit: number,
    private readonly onEvents?: MatchEventsListener
  ) {
    this.state = {
      choices: { order: [], chaos: [] },
      phase: {
        status: 'ongoing',
        turn: 'order',
        turnStartedAt: 0,
      },
      timelimit,
      timeSpent: { order: 0, chaos: 0 },
    }
  }

  start() {
    if (this.state.phase.status !== 'ongoing') throw new Error('match finished cannot be restarted')
    if (this.startedAt !== null) throw new Error("match can't be started twice")

    this.startedAt = performance.now()
    this.scheduleTimeout()
  }

  dispatch(cmd: MatchCommand): MatchEvent[] {
    const events = decide(this.state, cmd, this.now)
    // Race condition: o tempo já acabou e o timeout pendente vai disparar em seguida
    if (events.length === 0) return events

    this.state = events.reduce(evolve, this.state)
    clearTimeout(this.timeoutHandle)
    this.scheduleTimeout()
    this.onEvents?.(events, this.state)
    return events
  }

  dispose() {
    clearTimeout(this.timeoutHandle)
  }

  /** ms since the match started */
  private get now() {
    if (this.startedAt === null) throw new Error('match not started')
    return performance.now() - this.startedAt
  }

  private scheduleTimeout() {
    const remaining = timeLeft(this.state, this.now)
    if (remaining === null) return
    this.timeoutHandle = setTimeout(() => this.dispatch({ type: 'timeout' }), remaining)
  }
}

function timeLeft(state: MatchState, now: number): number | null {
  if (state.phase.status !== 'ongoing') return null
  const elapsedInTurn = now - state.phase.turnStartedAt
  return Math.max(0, state.timelimit - state.timeSpent[state.phase.turn] - elapsedInTurn)
}
