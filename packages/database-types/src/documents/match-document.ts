import { Choice, League, Team } from '@magic3t/common-types'

export const enum MatchDocumentGameMode {
  Casual = 0b00,
  Ranked = 0b10,
  PvP = 0b00,
  PvC = 0b01,
}

export const enum MatchDocumentEventType {
  Choice = 0,
  Forfeit = 1,
  Timeout = 2,
  Message = 3,
}

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
        event: MatchDocumentEventType.Choice
        choice: Choice
      }
    | {
        event: MatchDocumentEventType.Message
        message: string
      }
    | {
        event: MatchDocumentEventType.Timeout | MatchDocumentEventType.Forfeit
      }
  )

// TODO: improve this type later
/** Represents a match registry in the History. */
export type MatchDocument = {
  [Team.Order]: MatchDocumentTeam // TODO: put inside a teams object
  [Team.Chaos]: MatchDocumentTeam
  events: MatchDocumentEvent[]
  winner: Team | null
  game_mode: MatchDocumentGameMode
  timestamp: Date
}
