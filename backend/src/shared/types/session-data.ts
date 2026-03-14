import { UserRowRole } from '@magic3t/database-types'

export type SessionData = {
  id: number
  uuid: string
  role: UserRowRole
}
