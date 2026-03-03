import type { INTEGER, SMALLINT, TIMESTAMPTZ } from '../postgres'

export type UserIconRow = {
  user_id: INTEGER
  icon_id: SMALLINT
  granted_at: TIMESTAMPTZ
}
