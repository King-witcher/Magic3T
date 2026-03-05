import { IconRarity, IconRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import z from 'zod'
import { INSERT_INTO } from '@/shared/pg-chain'
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

const _TENCENT_ICONS = [
  'Alistar',
  'Evelynn',
  'Twisted Fate',
  'Akali',
  'Xin Zhao',
  'Katarina',
  'Garen',
  'Lux',
  'Shein',
  'Ashe',
  'Caitlyn',
  'Ezreal',
  'Gangplank',
  'Kayle',
  'LeBlanc',
  'Master Yi',
  'Miss Fortune',
  'Morgana',
  'Nasus',
  'Olaf',
  'Rammus',
  'Renekton',
  'Sona',
  'Taric',
  'Tryndamere',
  'Twitch',
  'Vayne',
  'Vladimir',
]

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
    await this.bulkCreate(iconRows)
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
      year_released: icon.yearReleased || null,
      content_id: icon.contentId,
      is_legacy: icon.isLegacy,
      rarity,
    }
  }

  private async bulkCreate(iconRows: IconRow[]) {
    await this.databaseService.transaction(async (client) => {
      for (const icon of iconRows) {
        const chain = INSERT_INTO('icon', icon)
        await client.query({
          name: 'insert_icon',
          text: chain.text,
          values: chain.values,
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
