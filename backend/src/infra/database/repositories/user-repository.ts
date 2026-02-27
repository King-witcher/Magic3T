import { UserDocumentRole, UserRow, user_role } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
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

  async getByFirebaseId(firebaseId: string): Promise<UserRow | null> {
    const [row] = await this.databaseService.query<UserRow>(sql`
      SELECT * FROM "user"
      WHERE firebase_id = ${firebaseId}
    `)
    return row ?? null
  }

  slugify(nickname: string): string {
    return nickname.toLowerCase().replaceAll(' ', '')
  }

  async regiser(firebaseId: string, nickname: string) {
    const ratingConfig = await this.configRepository.cachedGetRatingConfig()

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

  async bulkCreate(userRows: Omit<UserRow, 'id' | 'uuid' | 'profile_nickname_date'>[]) {
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
