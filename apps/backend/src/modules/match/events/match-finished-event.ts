import { ClientRank, Team, UserRole } from '@magic3t/common-types'
import { MatchDocumentEvent } from '@magic3t/database-types'
import { RatingState } from '@/modules/rating'

type FinishedMatchContextPlayer = {
  userId: string
  nickname: string
  role: UserRole
  previousElo: number
  matchScore: number
  timeSpent: number
  newRating: RatingState
  newClientRank: ClientRank
  lpGain: number | null
}

/**
 * Payload emitted by MatchService when a match is finished, containing all necessary information to generate the match report for clients and persist the match result in the database.
 */
export type FinishedMatchSummary = {
  order: FinishedMatchContextPlayer
  chaos: FinishedMatchContextPlayer
  winner: Team | null
  startedAt: Date
  events: MatchDocumentEvent[]
  ranked: boolean
}
