import type { BOOLEAN, SMALLINT, TEXT, UUID } from '../postgres'
import { IconRarityEnum } from '../types'

export type IconRow = {
  id: SMALLINT
  title: TEXT
  description: TEXT | null
  year_released: SMALLINT | null
  content_id: UUID
  is_legacy: BOOLEAN
  rarity: IconRarityEnum
}
