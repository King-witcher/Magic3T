import {
  IconRow,
  LeagueEnum,
  UserDocumentRole,
  UserRoleEnum,
  UserRow,
} from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { UserRecord } from 'firebase-admin/auth'
import { FirebaseAuthService } from '@/infra/firebase'
import { ConfigRepository, UserDocumentRepository } from '@/infra/firestore'
import { RatingService } from '@/modules/rating'
import { DatabaseError } from '@/shared/database/database-error'
import { IDbClient } from '@/shared/database/db-client'
import { INSERT_INTO, UPDATE } from '@/shared/database/pg-chain'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'
import { UserRepositoryError } from './user-repository-error'

const roleMap: Record<UserDocumentRole, UserRoleEnum> = {
  [UserDocumentRole.Player]: 'player',
  [UserDocumentRole.Creator]: 'superuser',
  [UserDocumentRole.Bot]: 'bot',
}

type RatingUpdateFields = Pick<
  UserRow,
  | 'mmr_score'
  | 'mmr_k_factor'
  | 'rank_league'
  | 'rank_division'
  | 'rank_lp'
  | 'rank_matches'
  | 'rank_date'
>

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name, { timestamp: true })

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly configRepository: ConfigRepository,
    private readonly ratingService: RatingService
  ) {}

  /** Imports users and their identities from Firebase Auth and Firestore */
  async importFromFirebase() {
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

    const mappedUsers = allUsers.filter(
      (user) => identities.has(user.id) || user.data.role === UserDocumentRole.Bot
    )

    const userRows = mappedUsers.map((user): [Partial<UserRow>, UserRecord | null] => {
      const summoner_icon =
        user.data.summoner_icon >= 59 && user.data.summoner_icon <= 78
          ? 29
          : user.data.summoner_icon

      const identity = identities.get(user.id)

      const { rank_league, rank_division, rank_lp } = this.ratingService.getRankFromLegacyMmr(
        user.data.elo.score,
        user.data.elo.matches
      )

      return [
        {
          role: roleMap[user.data.role],
          profile_nickname: user.data.identification.nickname,
          profile_nickname_slug: user.data.identification.unique_id,
          profile_icon: summoner_icon,
          profile_nickname_date: user.data.identification.last_changed ?? new Date(),

          mmr_score: user.data.elo.score,
          mmr_k_factor: user.data.elo.k,

          rank_league: rank_league as LeagueEnum | null,
          rank_division,
          rank_lp,
          rank_matches: user.data.elo.matches,

          stats_victories: user.data.stats.wins,
          stats_draws: user.data.stats.draws,
          stats_defeats: user.data.stats.defeats,
          created_at: identity ? new Date(identity.metadata.creationTime) : new Date(),
        },
        identity ?? null,
      ]
    })

    await this.databaseService.transaction(async (client) => {
      for (const [user, identity] of userRows) {
        this.logger.verbose(`Creating user ${user.profile_nickname}...`)
        const createUserChain = INSERT_INTO('"user"', user).RETURNING`id`
        const [row] = await client.query<{ id: number }>({
          name: 'create_user',
          text: createUserChain.text,
          values: createUserChain.values,
        })

        if (identity) {
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
  async createWithNickname(nickname: string, conn?: IDbClient): Promise<UserRow> {
    conn ??= this.databaseService

    const ratingConfig = await this.configRepository.getRatingConfig()

    const slug = this.slugify(nickname)
    const [created] =
      await conn.query<UserRow>(
        INSERT_INTO<Partial<UserRow>>('"user"', {
          profile_icon: 29,
          profile_nickname: nickname,
          profile_nickname_slug: slug,
          mmr_score: ratingConfig.initial_elo,
          mmr_k_factor: ratingConfig.initial_k_factor,
        }).RETURNING`*`
      )

    return created
  }

  /** Gets a user by their ID. */
  async getById(id: string): Promise<UserRow | null> {
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
      WHERE rank_league = 'challenger'
    `)
    return rows
  }

  async updateNickname(id: string, newNickname: string) {
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

  async updateIcon(id: string, iconId: number) {
    await this.databaseService.query(sql`
      UPDATE "user"
      SET profile_icon = ${iconId}
      WHERE id = ${id}
    `)
  }

  /** Updates a user's rating fields after a ranked match. */
  async updateRank(id: string, rating: Partial<RatingUpdateFields>, conn?: IDbClient): Promise<void> {
    conn ??= this.databaseService
    await conn.query(UPDATE`"user"`.SET(rating).WHERE`id = ${id}`)
  }

  /** Increments the win, draw or loss counter for a user after a match. */
  async addMatchResult(
    id: string,
    result: 'win' | 'draw' | 'loss',
    conn?: IDbClient
  ): Promise<void> {
    conn ??= this.databaseService

    switch (result) {
      case 'win':
        await conn.query(sql`
          UPDATE "user"
          SET stats_victories = stats_victories + 1
          WHERE id = ${id}
        `)
        break
      case 'draw':
        await conn.query(sql`
          UPDATE "user"
          SET stats_draws = stats_draws + 1
          WHERE id = ${id}
        `)
        break
      case 'loss':
        await conn.query(sql`
          UPDATE "user"
          SET stats_defeats = stats_defeats + 1
          WHERE id = ${id}
        `)
        break
    }
  }

  async setOrReplaceChallengers(newChallengerIds: string[]): Promise<void> {
    const oldChallengers = await this.listChallengers()
    const oldChallengerIdsSet = new Set(oldChallengers.map((c) => c.id))
    const newChallengerIdsSet = new Set(newChallengerIds)

    await this.databaseService.transaction(async (client) => {
      const toRemove = oldChallengers.filter((c) => !newChallengerIdsSet.has(c.id))
      for (const user of toRemove) {
        const { rank_league, rank_division, rank_lp } = this.ratingService.getRankFromLegacyMmr(
          user.mmr_score,
          user.rank_matches
        )
        await client.query(sql`
          UPDATE "user"
          SET rank_league = ${rank_league}, rank_division = ${rank_division}, rank_lp = ${rank_lp}
          WHERE id = ${user.id}
        `)
      }

      const idsToAdd = newChallengerIds.filter((id) => !oldChallengerIdsSet.has(id))
      if (idsToAdd.length > 0) {
        await client.query(sql`
          UPDATE "user"
          SET rank_league = 'challenger', rank_division = NULL
          WHERE id IN (${idsToAdd})
        `)
      }
    })
  }

  async getLeaderboard(minPlayed: number, limit: number): Promise<UserRow[]> {
    const rows = await this.databaseService.query<UserRow>(sql`
      SELECT *
      FROM "user"
      WHERE rank_league IS NOT NULL
        AND rank_matches >= ${minPlayed}
        AND "role" != 'bot'
      ORDER BY rank_league DESC, rank_division ASC NULLS FIRST, rank_lp DESC, id DESC
      LIMIT ${limit}
    `)
    return rows
  }

  async getUserIcons(id: string): Promise<IconRow[]> {
    const [user] = await this.databaseService.query<{ id: string }>(sql`
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

  async getIdMap(): Promise<
    Map<string | number, { firebase_id: string; uuid: string; id: number }>
  > {
    type Row = {
      firebase_id: string
      uuid: string
      id: number
    }
    const rows = await this.databaseService.query<Row>(sql`
      SELECT lui.firebase_id, u.uuid, u.id
      FROM legacy_user_identity lui
      JOIN "user" u ON lui.user_id = u.id
    `)

    return new Map<string | number, Row>(
      rows.flatMap((row) => [
        [row.firebase_id, row],
        [row.uuid, row],
        [row.id, row],
      ])
    )
  }
}
