import { Choice, League, Team } from '@magic3t/common-types'

export type MatchDocumentGameMode = 0 | 1 | 2

export type MatchDocumentEventType = 0 | 1 | 2 | 3

export interface MatchDocumentTeam {
  uid: string
  name: string
  league: League
  division: number | null
  score: number
  lp_gain: number
}

type BaseMatchDocumentEvent = {
  event: MatchDocumentEventType
  side: Team
  time: number
}

export type MatchDocumentEvent = BaseMatchDocumentEvent &
  (
    | {
        event: 0
        choice: Choice
      }
    | {
        event: 3
        message: string
      }
    | {
        event: 2 | 1
      }
  )

// TODO: improve this type later
/** Represents a match registry in the History. */
export type MatchDocument = {
  order: MatchDocumentTeam // TODO: put inside a teams object
  chaos: MatchDocumentTeam
  events: MatchDocumentEvent[]
  winner: Team | null
  game_mode: MatchDocumentGameMode
  timestamp: Date
}
