import { ClientRank, Team } from '@magic3t/common-types'
import { MatchDocumentEvent, UserRow } from '@magic3t/database-types'
import { RatingState } from '@/modules/rating'

type FinishedMatchContextPlayer = {
  row: UserRow
  matchScore: number
  timeSpent: number
  newRating: RatingState
  newRank: ClientRank
  lpGain: number | null
}

export type FinishedMatchContext = {
  order: FinishedMatchContextPlayer
  chaos: FinishedMatchContextPlayer
  winner: Team | null
  startedAt: Date
  events: MatchDocumentEvent[]
  ranked: boolean
}
