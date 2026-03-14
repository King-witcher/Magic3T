import { Choice } from '@magic3t/common-types'
import type { INTEGER, SMALLINT } from '../postgres'
import { MatchTeam } from './match-row'

export type MatchEventType = 'choice' | 'forfeit' | 'timeout'

export type MatchEventRow = {
  match_id: INTEGER
  sequence: SMALLINT
  time_ms: INTEGER
  type: MatchEventType
  team: MatchTeam
  choice: Choice | null
}
