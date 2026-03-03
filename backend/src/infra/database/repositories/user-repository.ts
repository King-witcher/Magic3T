import { IconRow, UserDocumentRole, UserRow, user_role } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { unexpected } from '@/common/errors/unexpected-error'
import { ConfigRepository, UserDocumentRepository } from '@/infra/firestore'
import { INSERT_INTO } from '@/shared/pg-chain'
import { sql } from '@/shared/sql'
import { DatabaseService } from '../database.service'

export type CreateUserRow = Omit<
  UserRow,
  | 'id'
  | 'uuid'
  | 'role'
  | 'credits'
  | 'xp'
  | 'profile_nickname_date'
  | 'profile_icon'
  | `rating_series_played`
  | `stats_${string}`
>

@Injectable()
export class UserRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userDocument: UserDocumentRepository,
    private readonly configRepository: ConfigRepository
  ) {}

  async importFromFirestore() {
    const users = await this.userDocument.listAll()
    const roleMap: Record<UserDocumentRole, user_role> = {
      [UserDocumentRole.Player]: 'player',
      [UserDocumentRole.Creator]: 'superuser',
      [UserDocumentRole.Bot]: 'bot',
    }

    console.log(`imported ${users.length} from firestore`)

    const userRows: Omit<UserRow, 'id' | 'uuid' | 'profile_nickname_date'>[] = users.map((user) => {
      const summoner_icon =
        user.data.summoner_icon >= 59 && user.data.summoner_icon <= 78
          ? 29
          : user.data.summoner_icon

      return {
        firebase_id: user.data.role !== UserDocumentRole.Bot ? user.id : null,
        role: roleMap[user.data.role],
        credits: user.data.magic_points,
        xp: user.data.experience,
        profile_nickname: user.data.identification.nickname,
        profile_nickname_slug: user.data.identification.unique_id,
        profile_icon: summoner_icon,
        rating_score: user.data.elo.score,
        rating_k_factor: user.data.elo.k,
        rating_apex: user.data.elo.challenger ? 'challenger' : null,
        rating_series_played: user.data.elo.matches,
        rating_date: new Date(),
        stats_victories: user.data.stats.wins,
        stats_draws: user.data.stats.draws,
        stats_defeats: user.data.stats.defeats,
      }
    })

    await this.bulkCreate(userRows)
  }

  /** Finds a user by their Firebase ID. */
  async getByFirebaseId(firebaseId: string): Promise<UserRow | null> {
    const [row] = await this.databaseService.query<UserRow>(sql`
      SELECT * FROM "user"
      WHERE firebase_id = ${firebaseId}
    `)
    return row ?? null
  }

  /** Slugifies a nickname. */
  slugify(nickname: string): string {
    return nickname.toLowerCase().replaceAll(' ', '')
  }

  /** Registers a new user to the database. */
  async register(firebaseId: string, nickname: string) {
    const ratingConfig = await this.configRepository.getRatingConfig()

    await this.databaseService.query(
      INSERT_INTO<Partial<UserRow>>('user', {
        firebase_id: firebaseId,
        profile_nickname: nickname,
        profile_nickname_slug: this.slugify(nickname),
        rating_score: ratingConfig.initial_elo,
        rating_k_factor: ratingConfig.initial_k_factor,
      }) //
        .RETURNING`*`
    )
  }

  /** Get a user by their nickname. */
  async getByNickname(nickname: string): Promise<UserRow | null> {
    const slug = this.slugify(nickname)
    const [row] = await this.databaseService.query<UserRow>(sql`
      SELECT * FROM "user"
      WHERE profile_nickname_slug = ${slug}
    `)
    return row ?? null
  }

  /** List all challengers. */
  async listChallengers(): Promise<UserRow[]> {
    const rows = await this.databaseService.query<UserRow>(sql`
      SELECT *
      FROM "user"
      WHERE rating_apex = 'challenger'
    `)
    return rows
  }

  async updateNickname(firebaseId: string, newNickname: string) {
    const slug = this.slugify(newNickname)
    const rows = await this.databaseService.query(sql`
      UPDATE "user"
      SET profile_nickname = ${newNickname},
          profile_nickname_slug = ${slug},
          profile_nickname_date = CURRENT_TIMESTAMP
      WHERE firebase_id = ${firebaseId}
      RETURNING id
    `)
    if (rows.length === 0) throw new Error(`User with firebaseId ${firebaseId} not found`)
  }

  async updateIcon(firebaseId: string, iconId: number) {
    await this.databaseService.query(sql`
      UPDATE "user"
      SET profile_icon = ${iconId}
      WHERE firebase_id = ${firebaseId}
    `)
  }

  /** Gets all bot users. */
  // async getBots(): Promise<UserRow[]> {
  //   // FIXME: set ids
  //   const bots = await this.configRepository.getBotConfigs()
  //   const uids = [bots.bot0.uid, bots.bot1.uid, bots.bot2.uid, bots.bot3.uid]
  //   return await Promise.all(
  //     uids.map(async (uid) => {
  //       const user = await this.getByFirebaseId(uid)
  //       if (!user) unexpected('Bot user not found', { uid })
  //       return user
  //     })
  //   )
  // }

  async setOrReplaceChallengers(newChallengerIds: string[]): Promise<void> {
    const oldChallengers = await this.listChallengers()
    const oldChallengerIdsSet = new Set(oldChallengers.map((c) => c.firebase_id!))
    const newChallengerIdsSet = new Set(newChallengerIds)

    await this.databaseService.transaction(async (client) => {
      // Remove challenger status from old challengers not in the new list
      const toRemove = oldChallengers.filter((c) => !newChallengerIdsSet.has(c.firebase_id!))
      await client.query(sql`
        UPDATE "user"
        SET rating_apex = NULL
        WHERE id IN (${toRemove.map((c) => c.id)})
      `)

      // Add challenger status to new challengers not in the old list
      const firebaseIdsToAdd = newChallengerIds.filter((id) => !oldChallengerIdsSet.has(id))
      await client.query(sql`
        UPDATE "user"
        SET rating_apex = 'challenger'
        WHERE firebase_id IN (${firebaseIdsToAdd})
      `)
    })
  }

  async getLeaderboard(minPlayed: number, limit: number): Promise<UserRow[]> {
    const rows = await this.databaseService.query<UserRow>(sql`
      SELECT *
      FROM "user"
      WHERE rating_series_played >= ${minPlayed}
        AND "role" != 'bot'
      ORDER BY rating_score DESC, rating_date DESC
      LIMIT ${limit}
    `)
    return rows
  }

  async getUserIcons(firebaseId: string): Promise<IconRow[]> {
    const [user] = await this.databaseService.query<{ id: number }>(sql`
      SELECT id
      FROM "user"
      WHERE firebase_id = ${firebaseId}
    `)
    if (!user) throw new Error(`User with id ${firebaseId} not found`)

    const rows = await this.databaseService.query<IconRow>(sql`
      SELECT *
      FROM user_icon ui
              JOIN icon i ON i.id = ui.icon_id
      WHERE ui.user_id = ${user.id}
      ORDER BY ui.granted_at DESC;
    `)
    return rows
  }

  private async bulkCreate(userRows: Omit<UserRow, 'id' | 'uuid' | 'profile_nickname_date'>[]) {
    await this.databaseService.transaction(async (client) => {
      for (const user of userRows) {
        console.info(`Importing user ${user.firebase_id ?? user.profile_nickname}`)
        await client.query({
          name: 'insert_user',
          text: `INSERT INTO "user" (
              firebase_id, role, credits, xp,
              profile_nickname, profile_nickname_slug, profile_icon,
              rating_score, rating_k_factor, rating_apex, rating_series_played, rating_date,
              stats_victories, stats_draws, stats_defeats
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          values: [
            user.firebase_id,
            user.role,
            user.credits,
            user.xp,
            user.profile_nickname,
            user.profile_nickname_slug,
            user.profile_icon,
            user.rating_score,
            user.rating_k_factor,
            user.rating_apex,
            user.rating_series_played,
            user.rating_date,
            user.stats_victories,
            user.stats_draws,
            user.stats_defeats,
          ],
        })
      }
    })
  }
}
