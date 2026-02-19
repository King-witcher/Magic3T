import { MatchRowEvent, UserRow, UserRowElo } from '@magic3t/database-types'
import { GetResult } from '@/infra/firestore/types'

export type MatchFinishedEvent = {
  order: {
    id: string
    matchScore: number
    row: GetResult<UserRow>
    newRating: UserRowElo
    time: number
  }
  chaos: {
    id: string
    matchScore: number
    row: GetResult<UserRow>
    newRating: UserRowElo
    time: number
  }

  startedAt: Date
  ranked: boolean
  events: MatchRowEvent[]
}
