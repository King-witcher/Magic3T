import type { BOOLEAN, INTEGER, REAL, TIMESTAMPTZ } from '../postgres'
import type { UserApexFlag } from './user-row'

export type UserRatingSnapshotRow = {
  id: INTEGER
  user_id: INTEGER
  score: REAL
  apex_flag: UserApexFlag | null
  hidden: BOOLEAN
  date: TIMESTAMPTZ
}
