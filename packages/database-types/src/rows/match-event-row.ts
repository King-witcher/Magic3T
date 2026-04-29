import { Choice } from '@magic3t/common-types'
import type { INTEGER, SMALLINT } from '../postgres'
import { MatchEventTypeEnum } from '../types/match-event-type-enum'
import { MatchTeamEnum } from '../types/match-team-enum'

export type MatchEventRow = {
  match_id: INTEGER
  sequence: SMALLINT
  time_ms: INTEGER
  type: MatchEventTypeEnum
  team: MatchTeamEnum
  choice: Choice | null
}
