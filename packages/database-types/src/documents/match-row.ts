import { Choice, League, Team } from '@magic3t/common-types'

export const enum MatchRowGameMode {
  Casual = 0b00,
  Ranked = 0b10,
  PvP = 0b00,
  PvC = 0b01,
}

export const enum MatchRowEventType {
  Choice = 0,
  Forfeit = 1,
  Timeout = 2,
  Message = 3,
}

export interface MatchRowTeam {
  uid: string
  name: string
  league: League
  division: number | null
  score: number
  lp_gain: number
}

type BaseMatchRowEvent = {
  event: MatchRowEventType
  side: Team
  time: number
}

export type MatchRowEvent = BaseMatchRowEvent &
  (
    | {
        event: MatchRowEventType.Choice
        choice: Choice
      }
    | {
        event: MatchRowEventType.Message
        message: string
      }
    | {
        event: MatchRowEventType.Timeout | MatchRowEventType.Forfeit
      }
  )

// TODO: improve this type later
/** Represents a match registry in the History. */
export type MatchRow = {
  [Team.Order]: MatchRowTeam // TODO: put inside a teams object
  [Team.Chaos]: MatchRowTeam
  events: MatchRowEvent[]
  winner: Team | null
  game_mode: MatchRowGameMode
  timestamp: Date
}
