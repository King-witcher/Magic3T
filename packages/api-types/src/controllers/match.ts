import type { Choice, ClientRank } from '@magic3t/common-types'

export namespace Match {
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
  export const enum MatchError {
    /** Error when a player is already participating in another match */
    AlreadyInMatch = 'AlreadyInMatch',
    /** Error when the specified bot cannot be found */
    BotNotFound = 'BotNotFound',
    /** Error when it's not the player's turn to act */
    WrongTurn = 'WrongTurn',
    /** Error when the selected choice is not available in the current state */
    ChoiceUnavailable = 'ChoiceUnavailable',
    /** Error when no match was found for the user */
    MatchNotFound = 'MatchNotFound',
  }
}
