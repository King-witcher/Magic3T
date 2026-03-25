import type { BotId } from '@magic3t/common-types'
import type { UUID } from '../postgres'

export type BotIdUserRow = {
  bot_id: BotId
  user_id: UUID
}
