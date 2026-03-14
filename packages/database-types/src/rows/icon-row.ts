import type { BOOLEAN, SMALLINT, TEXT, UUID } from '../postgres'

export type IconRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'ultimate'
  | 'exalted'
  | 'transcendent'

export type IconRow = {
  id: SMALLINT
  title: TEXT
  description: TEXT | null
  year_released: SMALLINT | null
  content_id: UUID
  is_legacy: BOOLEAN
  rarity: IconRarity
}
