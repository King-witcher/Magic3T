import type { Team } from '@magic3t/common-types'
import type { MatchRowEvent, MatchRowTeam } from '@magic3t/database-types'

export namespace Match {
  export type FindMatchResult = {
    id: string
    order: MatchRowTeam
    chaos: MatchRowTeam
    events: MatchRowEvent[]
    winner: Team | null
    date: Date
  }

  export type ListMatchesResultItem = {
    id: string
    order: MatchRowTeam
    chaos: MatchRowTeam
    events: MatchRowEvent[]
    winner: Team | null
    date: Date
  }

  export type ListMatchesResult = {
    matches: ListMatchesResultItem[]
    // pagination: {}
  }

  export type GetCurrentMatchResult = object

  /** Represents possible errors that can occur in the match domain */
  export const enum MatchError {
    /** Error when a player is already participating in another match */
    AlreadyInMatch = 'alreadyInMatch',
    /** Error when the specified bot cannot be found */
    BotNotFound = 'botNotFound',
    /** Error when it's not the player's turn to act */
    WrongTurn = 'wrongTurn',
    /** Error when the selected choice is not available in the current state */
    ChoiceUnavailable = 'choiceUnavailable',
    /** Error when no match was found for the user */
    MatchNotFound = 'matchNotFound',
  }
}
