import { Team, UserRole } from '@magic3t/common-types'
import { MatchEventRow } from '@magic3t/database-types'
import { UserRatingFields } from '@/modules/rating'

type FinishedMatchContextPlayer = {
  userId: string
  nickname: string
  role: UserRole
  matchScore: number
  timeSpent: number
  newRating: UserRatingFields
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
  events: MatchEventRow[]
  ranked: boolean
}
