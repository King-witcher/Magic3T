import type { Choice, ClientRank, Team } from '@magic3t/common-types'

export type MatchClientEvents = 'get-assignments' | 'get-state' | 'pick' | 'message' | 'surrender'

export type MatchServerEvents = 'message' | 'assignments' | 'state-report' | 'match-report'

/** Represents a message data sent by the server */
export type MessagePayload = {
  message: string
  sender: string
  time: number
}

export type AssignmentsPayloadProfile = {
  id: string
}

export type AssignmentsPayload = {
  order: {
    profile: AssignmentsPayloadProfile
  }
  chaos: {
    profile: AssignmentsPayloadProfile
  }
}

export type StateReportPayload = {
  order: {
    timeLeft: number
    choices: Choice[]
    surrender: boolean
  }
  chaos: {
    timeLeft: number
    choices: Choice[]
    surrender: boolean
  }
  turn: Team | null
  finished: boolean
  pending: false
}

export type MatchReportPayload = {
  matchId: string
  winner: Team | null
  order: {
    score: number
    lpGain: number | null
    newRank: ClientRank
  }
  chaos: {
    score: number
    lpGain: number | null
    newRank: ClientRank
  }
}

export interface GameServerEventsMap {
  message(message: MessagePayload): void
  assignments(assignments: AssignmentsPayload): void
  'state-report'(state: StateReportPayload): void
  'match-report'(results: MatchReportPayload): void
}

export interface GameClientEventsMap {
  'get-assignments'(): void
  'get-state'(): void
  message(message: string): void
  pick(choice: Choice): void
  surrender(): void
}
