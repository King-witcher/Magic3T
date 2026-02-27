import { IconRarity, IconRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import z from 'zod'
import { DatabaseService } from '../database.service'

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

const RARITIES = [
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'ultimate',
  'exalted',
  'transcendent',
] as const satisfies IconRarity[]

const COMMUNITY_DRAGON_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-icons.json'

export type RiotIcon = z.infer<typeof RIOT_ICON_SCHEMA>

@Injectable()
export class IconRepository {
  private logger = new Logger(IconRepository.name, { timestamp: true })
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<IconRow[]> {
    const result = await this.databaseService.query<IconRow>('SELECT * FROM icons')
    return result
  }

  @Cron('0 5 * * 3')
  async syncIcons() {
    this.logger.log('Starting icon repopulation process...')
    const [riotIcons, dbIconIds] = await Promise.all([
      this.listAllRiotIcons(),
      this.databaseService
        .query<IconRow>('SELECT * FROM icon')
        .then((rows) => new Set(rows.map((row) => row.id))),
    ])

    const newIcons = riotIcons.filter((icon) => !dbIconIds.has(icon.id))

    if (newIcons.length === 0) {
      this.logger.log('No new icons found. Database is up to date.')
      return
    }

    this.logger.log(`Found ${newIcons.length} new icons. Adding to the database...`)
    const iconRows = newIcons.map((icon) => this.getIconRowFromRiotIcon(icon))
    await this.batchInsertIcons(iconRows)
    this.logger.log('Icon repopulation process completed successfully.')
  }

  private getIconRowFromRiotIcon(icon: RiotIcon): IconRow {
    const description =
      icon.descriptions.find((d) => d.region === 'riot')?.description ??
      icon.descriptions[0]?.description ??
      null

    const rarityIndex =
      icon.rarities.find((r) => r.region === 'riot')?.rarity ?? icon.rarities[0]?.rarity ?? 0

    const rarity = RARITIES[rarityIndex]

    return {
      id: icon.id,
      title: icon.title,
      description,
      yearReleased: icon.yearReleased,
      contentId: icon.contentId,
      isLegacy: icon.isLegacy,
      rarity,
    }
  }

  private async batchInsertIcons(iconRows: IconRow[]) {
    await this.databaseService.transaction(async (client) => {
      for (const icon of iconRows) {
        await client.query({
          name: 'insert-icon',
          text: 'INSERT INTO icon (id, title, description, year_released, content_id, is_legacy, rarity) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          values: [
            icon.id,
            icon.title,
            icon.description,
            icon.yearReleased,
            icon.contentId,
            icon.isLegacy,
            icon.rarity,
          ],
        })
      }
    })
  }

  private async listAllRiotIcons(): Promise<RiotIcon[]> {
    this.logger.log('Fetching Riot icons from Community Dragon...')
    const response = await fetch(COMMUNITY_DRAGON_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch Riot icons: ${response.statusText}`)
    }
    const data = await response.json()
    this.logger.log(`Validating and parsing icons from Riot...`)
    const parsed = z.array(RIOT_ICON_SCHEMA).parse(data)
    return parsed
  }
}
