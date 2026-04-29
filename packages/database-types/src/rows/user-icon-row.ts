import type { SMALLINT, TIMESTAMPTZ, UUID } from '../postgres'

export type UserIconRow = {
  user_id: UUID
  icon_id: SMALLINT
  granted_at: TIMESTAMPTZ
}
