import type { Choice, ClientRank } from '@magic3t/common-types'

export namespace Match {
  export type MatchEventType = GetMatchResultEvent['event']

  export type GetMatchResultEvent =
    | {
        event: 'forfeit' | 'timeout'
        team: 'order' | 'chaos'
        time: number
      }
    | {
        event: 'choice'
        team: 'order' | 'chaos'
        time: number
        choice: Choice
      }

  export type GetMatchResultTeam = {
    uuid: string | null
    nickname: string
    rank: ClientRank
    lpGain: number | null
    score: number
  }

  export type GetMatchResult = {
    uuid: string
    order: GetMatchResultTeam
    chaos: GetMatchResultTeam
    events: GetMatchResultEvent[]
    winner: 'order' | 'chaos' | null
    date: Date
  }

  export type ListMatchesResultItem = {
    uuid: string
    order: GetMatchResultTeam
    chaos: GetMatchResultTeam
    winner: 'order' | 'chaos' | null
    date: Date
  }

  export type ListMatchesResult = {
    matches: ListMatchesResultItem[]
    // pagination: {}
  }

  /** Represents possible errors that can occur in the match domain */
  export type MatchError =
    | 'AlreadyInMatch'
    | 'BotNotFound'
    | 'WrongTurn'
    | 'ChoiceUnavailable'
    | 'MatchNotFound'
}
