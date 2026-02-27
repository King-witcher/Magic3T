import { UUID } from '../postgres'

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
  id: number
  title: string
  description: string | null
  yearReleased: number
  contentId: UUID
  isLegacy: boolean
  rarity: IconRarity
}
