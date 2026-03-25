import { UUID } from 'node:crypto'
import type { SMALLINT, TIMESTAMPTZ } from '../postgres'

export type UserIconRow = {
  user_id: UUID
  icon_id: SMALLINT
  granted_at: TIMESTAMPTZ
}
