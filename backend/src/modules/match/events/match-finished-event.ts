import { MatchRowEvent, UserDocument, UserDocumentElo } from '@magic3t/database-types'
import { GetResult } from '@/infra/firestore/types'

export type MatchFinishedEvent = {
  order: {
    id: string
    matchScore: number
    row: GetResult<UserDocument>
    newRating: UserDocumentElo
    time: number
  }
  chaos: {
    id: string
    matchScore: number
    row: GetResult<UserDocument>
    newRating: UserDocumentElo
    time: number
  }

  startedAt: Date
  ranked: boolean
  events: MatchRowEvent[]
}
