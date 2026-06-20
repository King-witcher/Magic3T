import { IconRow, UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { ConfigRepository } from '@/infra/firestore'
import { RatingService } from '@/modules/rating'
import { DatabaseError } from '@/shared/database/database-error'
import { IDbClient } from '@/shared/database/db-client'
import { INSERT_INTO, PgChain, chain as raw, SELECT, UPDATE } from '@/shared/database/pg-chain'
import { sql } from '@/shared/database/sql'
import { DatabaseService } from '../database.service'
import { UserRepositoryError } from './user-repository-error'

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

/** A user row joined with their (optional) legacy e-mail, used by the admin panel. */
export type AdminUserRow = UserRow & { email: string | null }

/** A keyset cursor: the sort value and id of the last item from the previous page. */
export type AdminListCursor = { sortValue: string | number; id: string }

export type AdminListUsersParams = {
  search?: string
  sort: 'nickname' | 'createdAt' | 'elo'
  order: 'asc' | 'desc'
  limit: number
  cursor?: AdminListCursor
  /** When true, also runs a COUNT for the total number of matches (first page only). */
  withTotal: boolean
}

/**
 * Whitelist mapping the public sort keys to trusted, raw SQL fragments: the column to sort by
 * and the type the cursor value is cast to in the keyset predicate. They are built as `PgChain`
 * fragments so the identifiers are inlined as raw SQL (only the values are bound as parameters).
 */
const ADMIN_SORT_FRAGMENTS = {
  nickname: { column: () => raw`u.profile_nickname_slug`, cast: () => raw`text` },
  createdAt: { column: () => raw`u.created_at`, cast: () => raw`timestamptz` },
  elo: { column: () => raw`u.mmr_score`, cast: () => raw`real` },
} as const

@Injectable()
export class UserRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configRepository: ConfigRepository,
    private readonly ratingService: RatingService
  ) {}

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
  async updateRank(
    id: string,
    rating: Partial<RatingUpdateFields>,
    conn?: IDbClient
  ): Promise<void> {
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

  /**
   * Lists users for the admin panel, with optional free-text search (nickname or UUID) and
   * keyset (cursor) pagination over a whitelisted sort column. Returns up to `params.limit`
   * rows plus the total match count (only when `params.withTotal` is set).
   */
  async adminListUsers(
    params: AdminListUsersParams
  ): Promise<{ rows: AdminUserRow[]; total: number | null }> {
    const fragments = ADMIN_SORT_FRAGMENTS[params.sort]
    const column = fragments.column()
    const cast = fragments.cast()
    // The id tiebreaker follows the same direction as the primary sort, making the (sort, id)
    // pair a total order. Direction and comparison are raw fragments, never bound parameters.
    const direction = params.order === 'asc' ? raw`ASC` : raw`DESC`
    const comparison = params.order === 'asc' ? raw`>` : raw`<`

    const search = params.search?.trim()
    const cursor = params.cursor

    // Conditional fragment for the free-text filter; PgChain binds the values as parameters.
    const applySearch = (query: PgChain) =>
      query.AND`(u.profile_nickname ILIKE ${`%${search}%`} OR u.id::text ILIKE ${`${search}%`})`

    let total: number | null = null
    if (params.withTotal) {
      const countQuery = SELECT`COUNT(*)::int AS count`.FROM`"user" u`.WHERE`TRUE`.if(
        !!search,
        applySearch
      )
      const [countRow] = await this.databaseService.query<{ count: number }>({
        text: countQuery.text,
        values: countQuery.values,
      })
      total = countRow?.count ?? 0
    }

    const rows = await this.databaseService.query<AdminUserRow>(
      SELECT`u.*, lui.email`.FROM`"user" u`.LEFT_JOIN`legacy_user_identity lui`
        .ON`lui.user_id = u.id`.WHERE`TRUE`
        .if(!!search, applySearch)
        // Keyset predicate: rows strictly "after" the cursor in the (sort, id) ordering.
        .if(
          !!cursor,
          (query) =>
            query.AND`(${column} ${comparison} ${cursor?.sortValue}::${cast} OR (${column} = ${cursor?.sortValue}::${cast} AND u.id ${comparison} ${cursor?.id}::uuid))`
        ).ORDER_BY`${column} ${direction}, u.id ${direction}`.LIMIT`${params.limit}`
    )

    return { rows, total }
  }

  /** Gets a single user (with their optional legacy e-mail) for the admin detail screen. */
  async adminGetUserById(id: string): Promise<AdminUserRow | null> {
    const [row] = await this.databaseService.query<AdminUserRow>(sql`
      SELECT u.*, lui.email
      FROM "user" u
      LEFT JOIN legacy_user_identity lui ON lui.user_id = u.id
      WHERE u.id = ${id}
    `)
    return row ?? null
  }

  /**
   * Applies a partial update to a user from the admin panel.
   * Returns false when no user matched the given id.
   *
   * @throws UserRepositoryError('NicknameAlreadyTaken') on a unique nickname collision.
   */
  async adminUpdateUser(id: string, fields: Partial<UserRow>): Promise<boolean> {
    const chain = UPDATE`"user"`.SET(fields).WHERE`id = ${id}`.RETURNING`id`
    try {
      const rows = await this.databaseService.query<{ id: string }>({
        text: chain.text,
        values: chain.values,
      })
      return rows.length > 0
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.cause.constraint === 'user_profile_nickname_slug_key'
      ) {
        throw new UserRepositoryError('NicknameAlreadyTaken')
      }
      throw error
    }
  }
}
