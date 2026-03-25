import type { BOOLEAN, INTEGER, REAL, TIMESTAMPTZ, UUID } from '../postgres'
import type { UserApexFlag } from './user-row'

export type UserRatingSnapshotRow = {
  id: INTEGER
  user_id: UUID
  score: REAL
  apex_flag: UserApexFlag | null
  hidden: BOOLEAN
  date: TIMESTAMPTZ
}
