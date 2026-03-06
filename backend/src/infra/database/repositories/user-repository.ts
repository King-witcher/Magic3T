import { IconRow, UserDocumentRole, UserRow, UserRowRole } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { UserRecord } from 'firebase-admin/auth'
import { FirebaseAuthService } from '@/infra/firebase'
import { ConfigRepository, UserDocumentRepository } from '@/infra/firestore'
import { DatabaseError } from '@/shared/database/database-error'
import { IDbClient } from '@/shared/database/db-client'
import { INSERT_INTO } from '@/shared/database/pg-chain'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'
import { UserRepositoryError } from './user-repository-error'

const roleMap: Record<UserDocumentRole, UserRowRole> = {
  [UserDocumentRole.Player]: 'player',
  [UserDocumentRole.Creator]: 'superuser',
  [UserDocumentRole.Bot]: 'bot',
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name, { timestamp: true })

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly configRepository: ConfigRepository
  ) {}

  /** Imports users and their identities from Firebase Auth and Firestore */
  async importFromFirebase() {
    // Gets all identities and users from Firebase
    const [identities, allUsers] = await Promise.all([
      this.firebaseAuthService.listFirebaseAccounts().then(([identities]) => {
        this.logger.log(`Fetched ${identities.length} identities from Firebase Auth`)
        const map = new Map(identities.map((identity) => [identity.uid, identity]))
        return map
      }),
      this.userDocumentRepository.getAll().then((items) => {
        this.logger.log(`Fetched ${items.length} user documents from Firestore`)
        return items
      }),
    ])

    // Filters users that don't have a corresponding identity
    const mappedUsers = allUsers.filter((user) => identities.has(user.id))

    // Map user documents to user rows and hash join them with identities
    const userRows = mappedUsers.map((user): [Partial<UserRow>, UserRecord] => {
      const summoner_icon =
        user.data.summoner_icon >= 59 && user.data.summoner_icon <= 78
          ? 29
          : user.data.summoner_icon

      const identity = identities.get(user.id)!

      return [
        {
          role: roleMap[user.data.role],
          profile_nickname: user.data.identification.nickname,
          profile_nickname_slug: user.data.identification.unique_id,
          profile_icon: summoner_icon,
          rating_score: user.data.elo.score,
          rating_k_factor: user.data.elo.k,
          rating_apex_flag: user.data.elo.challenger ? 'challenger' : null,
          rating_ranked_count: user.data.elo.matches,
          stats_victories: user.data.stats.wins,
          stats_draws: user.data.stats.draws,
          stats_defeats: user.data.stats.defeats,
          profile_nickname_date: user.data.identification.last_changed ?? new Date(),
          created_at: new Date(identity.metadata.creationTime),
        },
        identity,
      ]
    })

    await this.databaseService.transaction(async (client) => {
      for (const [user, identity] of userRows) {
        // Create a user entry in the database
        this.logger.verbose(`Creating user ${user.profile_nickname}...`)
        const createUserChain = INSERT_INTO('"user"', user).RETURNING`id`
        const [row] = await client.query<{ id: number }>({
          name: 'create_user',
          text: createUserChain.text,
          values: createUserChain.values,
        })

        // Create it's legacy identity entry
        this.logger.verbose(`Creating legacy identity for user ${user.profile_nickname}...`)
        const identityChain = INSERT_INTO('legacy_user_identity', {
          user_id: row.id,
          firebase_id: identity.uid,
          email: identity.email,
        })
        await client.query({
          name: 'create_user_identity',
          text: identityChain.text,
          values: identityChain.values,
        })
      }
    })

    this.logger.log(`Successfully imported ${userRows.length} users from Firebase`)
  }

  /** Finds a user by their Firebase ID. */
  async getByFirebaseId(firebaseId: string): Promise<UserRow | null> {
    const [row] = await this.databaseService.query<UserRow>(sql`
      SELECT u.*
      FROM "user" u
      RIGHT JOIN legacy_user_identity lui
      ON lui.user_id = u.id
      WHERE lui.firebase_id = ${firebaseId}
    `)
    return row ?? null
  }

  /** Slugifies a nickname. */
  slugify(nickname: string): string {
    return nickname.toLowerCase().replaceAll(' ', '')
  }

  /** Creates a new user with the given nickname. */
  async create(nickname: string, client?: IDbClient): Promise<UserRow> {
    client ??= this.databaseService

    const ratingConfig = await this.configRepository.getRatingConfig()

    const slug = this.slugify(nickname)
    const [created] =
      await client.query<UserRow>(
        INSERT_INTO<Partial<UserRow>>('"user"', {
          profile_icon: 29,
          profile_nickname: nickname,
          profile_nickname_slug: slug,
          rating_score: ratingConfig.initial_elo,
          rating_k_factor: ratingConfig.initial_k_factor,
        }).RETURNING`*`
      )

    return created
  }

  async getById(id: number): Promise<UserRow | null> {
    const [row] = await this.databaseService.query<UserRow>(sql`
      SELECT *
      FROM "user"
      WHERE id = ${id}
    `)
    return row ?? null
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

  async updateNickname(id: number, newNickname: string) {
    const slug = this.slugify(newNickname)
    try {
      const rows = await this.databaseService.query(sql`
        UPDATE "user"
        SET profile_nickname = ${newNickname},
            profile_nickname_slug = ${slug},
            profile_nickname_date = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id
      `)
      if (rows.length === 0) throw new Error(`User with id ${id} not found`)
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throw new UserRepositoryError('NicknameAlreadyTaken')
      }
      throw error
    }
  }

  async updateIcon(id: number, iconId: number) {
    await this.databaseService.query(sql`
      UPDATE "user"
      SET profile_icon = ${iconId}
      WHERE id = ${id}
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

  async setOrReplaceChallengers(newChallengerIds: number[]): Promise<void> {
    const oldChallengers = await this.listChallengers()
    const oldChallengerIdsSet = new Set(oldChallengers.map((c) => c.id))
    const newChallengerIdsSet = new Set(newChallengerIds)

    await this.databaseService.transaction(async (client) => {
      // Remove challenger status from old challengers not in the new list
      const toRemove = oldChallengers.filter((c) => !newChallengerIdsSet.has(c.id))
      await client.query(sql`
        UPDATE "user"
        SET rating_apex_flag = NULL
        WHERE id IN (${toRemove.map((c) => c.id)})
      `)

      // Add challenger status to new challengers not in the old list
      const idsToAdd = newChallengerIds.filter((id) => !oldChallengerIdsSet.has(id))
      await client.query(sql`
        UPDATE "user"
        SET rating_apex_flag = 'challenger'
        WHERE id IN (${idsToAdd})
      `)
    })
  }

  async getLeaderboard(minPlayed: number, limit: number): Promise<UserRow[]> {
    const rows = await this.databaseService.query<UserRow>(sql`
      SELECT *
      FROM "user"
      WHERE rating_ranked_count >= ${minPlayed}
        AND "role" != 'bot'
      ORDER BY rating_score DESC, id DESC
      LIMIT ${limit}
    `)
    return rows
  }

  async getUserIcons(id: number): Promise<IconRow[]> {
    const [user] = await this.databaseService.query<{ id: number }>(sql`
      SELECT id
      FROM "user"
      WHERE id = ${id}
    `)
    if (!user) throw new Error(`User with id ${id} not found`)

    const rows = await this.databaseService.query<IconRow & { granted_at: Date }>(sql`
      SELECT i.*, ui.granted_at
      FROM user_icon ui
              JOIN icon i ON i.id = ui.icon_id
      WHERE ui.user_id = ${user.id}
      ORDER BY ui.granted_at DESC;
    `)
    return rows
  }
}
