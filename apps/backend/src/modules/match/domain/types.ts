import { Choice, Team } from '@magic3t/common-types'

export type Outcome = {
  finishReason: 'magic3t' | 'timeout' | 'surrender' | 'draw'
  orderScore: number
}

export type MatchState = {
  choices: Record<Team, Choice[]>
  timeSpent: Record<Team, number>
  /** ms */
  timelimit: number
  // dentro de outro objeto pra facilitar trocar sem precisar reescrever todo o MatchState
  phase:
    | {
        status: 'ongoing'
        turn: Team
        turnStartedAt: number
      }
    | {
        status: 'finished'
        outcome: Outcome
      }
}

export type MatchCommand =
  | {
      type: 'pick'
      value: Choice
      team: Team
    }
  | {
      type: 'surrender'
      team: Team
    }
  | {
      type: 'timeout'
    }

export type MatchEvent =
  | {
      type: 'choice-made'
      choice: Choice
      team: Team
      outcome: Outcome | null
      /** ms relative to match start */
      at: number
    }
  | {
      type: 'surrendered'
      team: Team
      /** ms relative to match start */
      at: number
    }
  | {
      type: 'timed-out'
      team: Team
      at: number
    }
