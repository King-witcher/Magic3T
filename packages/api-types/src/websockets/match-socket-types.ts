import type { Choice, ClientRank, Team } from '@magic3t/common-types'

export const enum MatchClientEvents {
  GetAssignments = 'get-assignments',
  GetState = 'get-state',
  Pick = 'pick',
  Message = 'message',
  Surrender = 'surrender',
}

export const enum MatchServerEvents {
  Message = 'message',
  /// Sends the player assignments
  Assignments = 'assignments',
  /// Send the match state report
  StateReport = 'state-report',
  /// Send the match result report
  MatchReport = 'match-report',
}

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
  [MatchServerEvents.Message](message: MessagePayload): void
  [MatchServerEvents.Assignments](assignments: AssignmentsPayload): void
  [MatchServerEvents.StateReport](state: StateReportPayload): void
  [MatchServerEvents.MatchReport](results: MatchReportPayload): void
}

export interface GameClientEventsMap {
  [MatchClientEvents.GetAssignments](): void
  [MatchClientEvents.GetState](): void
  [MatchClientEvents.Message](message: string): void
  [MatchClientEvents.Pick](choice: Choice): void
  [MatchClientEvents.Surrender](): void
}
