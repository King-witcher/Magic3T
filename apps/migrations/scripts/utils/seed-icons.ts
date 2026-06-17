import { z } from 'zod'

/**
 * Fetches real summoner-icon metadata from Community Dragon and maps it to `icon`
 * rows, mirroring `IconRepository.syncIcons` in the backend so the dev database
 * holds the same icons production would sync. Kept self-contained (only `zod`)
 * so it lives comfortably inside the migrations workspace.
 */

const RIOT_ICON_SCHEMA = z.object({
  id: z.int(),
  contentId: z.uuidv4(),
  title: z.string(),
  yearReleased: z.int(),
  isLegacy: z.boolean(),
  imagePath: z.string().optional(),
  descriptions: z.array(
    z.object({
      region: z.string(),
      description: z.string(),
    })
  ),
  rarities: z.array(
    z.object({
      region: z.string(),
      rarity: z.number(),
    })
  ),
  disabledRegions: z.array(z.string()),
})

type RiotIcon = z.infer<typeof RIOT_ICON_SCHEMA>

const RARITIES = [
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'ultimate',
  'exalted',
  'transcendent',
] as const

const COMMUNITY_DRAGON_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-icons.json'

export type IconRow = {
  id: number
  title: string
  description: string | null
  year_released: number | null
  content_id: string
  is_legacy: boolean
  rarity: (typeof RARITIES)[number]
}

/** Maps a raw Riot icon to a DB row — same logic as `getIconRowFromRiotIcon`. */
function getIconRowFromRiotIcon(icon: RiotIcon): IconRow {
  const description =
    icon.descriptions.find((d) => d.region === 'riot')?.description ??
    icon.descriptions[0]?.description ??
    null

  const rarityIndex =
    icon.rarities.find((r) => r.region === 'riot')?.rarity ?? icon.rarities[0]?.rarity ?? 0

  return {
    id: icon.id,
    title: icon.title,
    description,
    year_released: icon.yearReleased || null,
    content_id: icon.contentId,
    is_legacy: icon.isLegacy,
    rarity: RARITIES[rarityIndex] ?? RARITIES[0],
  }
}

/** Fetches and validates the full Riot icon catalogue, returning ready-to-insert rows. */
export async function fetchRiotIcons(): Promise<IconRow[]> {
  const response = await fetch(COMMUNITY_DRAGON_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch Riot icons: ${response.statusText}`)
  }
  const data = await response.json()
  const parsed = z.array(RIOT_ICON_SCHEMA).parse(data)
  return parsed.map(getIconRowFromRiotIcon)
}
