import type { INTEGER, SMALLINT } from '../postgres'

export type MatchEventType = 'choice' | 'forfeit' | 'timeout'

export type MatchEventRow = {
  match_id: INTEGER
  sequence: SMALLINT
  time_ms: INTEGER
  event_type: MatchEventType
  choice: SMALLINT | null
}
