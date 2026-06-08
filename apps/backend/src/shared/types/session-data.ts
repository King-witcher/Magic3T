import { UserRoleEnum } from '@magic3t/database-types'

export type SessionData = {
  userId: string
  role: UserRoleEnum
}
