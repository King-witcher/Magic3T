import { Admin } from '@magic3t/api-types'
import { Division, League, UserRole } from '@magic3t/common-types'
import { IconRow, LeagueEnum, UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { respondError } from '@/common'
import { IconRepository } from '@/infra/database/repositories/icon-repository'
import {
  AdminListCursor,
  AdminUserRow,
  UserRepository,
} from '@/infra/database/repositories/user-repository'
import { UserRepositoryError } from '@/infra/database/repositories/user-repository-error'

/** Icon ids every account owns by default (mirrors `UserService.BASE_ICONS`). */
const BASE_ICON_IDS = Array.from({ length: 30 }, (_, index) => index)

/** Encodes the keyset cursor (sort value + id) of a row into an opaque token. */
function encodeCursor(sort: Admin.ListUsersSort, row: AdminUserRow): string {
  const sortValue =
    sort === 'nickname'
      ? row.profile_nickname_slug
      : sort === 'createdAt'
        ? row.created_at.toISOString()
        : row.mmr_score
  return Buffer.from(JSON.stringify({ s: sortValue, id: row.id }), 'utf8').toString('base64url')
}

/** Decodes an opaque cursor token back into a keyset cursor, rejecting malformed input. */
function decodeCursor(cursor: string): AdminListCursor {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (
      (typeof parsed.s !== 'string' && typeof parsed.s !== 'number') ||
      typeof parsed.id !== 'string'
    ) {
      throw new Error('Malformed cursor payload')
    }
    return { sortValue: parsed.s, id: parsed.id }
  } catch {
    respondError('InvalidCursor', 400, 'Invalid pagination cursor')
  }
}

@Injectable()
export class AdminUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly iconRepository: IconRepository
  ) {}

  async listUsers(query: Admin.ListUsersQuery): Promise<Admin.ListUsersResult> {
    const limit = query.limit ?? 30
    const sort = query.sort ?? 'createdAt'
    const order = query.order ?? 'desc'
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined

    // Fetch one extra row to detect whether another page exists.
    const { rows, total } = await this.userRepository.adminListUsers({
      search: query.search,
      sort,
      order,
      limit: limit + 1,
      cursor,
      withTotal: !cursor,
    })

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows
    const lastRow = pageRows.at(-1)
    const nextCursor = hasMore && lastRow ? encodeCursor(sort, lastRow) : null

    return {
      data: pageRows.map((row) => this.toListItem(row)),
      nextCursor,
      total,
    }
  }

  async getUser(id: string): Promise<Admin.AdminUserDetail> {
    const row = await this.userRepository.adminGetUserById(id)
    if (!row) respondError('user-not-found', 404, 'User not found')

    const grantedIcons = await this.userRepository.getUserIcons(id)
    const ownedIcons = [...new Set([...BASE_ICON_IDS, ...grantedIcons.map((icon) => icon.id)])]

    return this.toDetail(row, ownedIcons)
  }

  async listIcons(): Promise<Admin.ListIconsResult> {
    const rows = await this.iconRepository.listAllOrderedByRelease()
    return { data: rows.map((row) => this.toIconItem(row)) }
  }

  async updateUser(
    requesterRole: UserRole,
    id: string,
    command: Admin.UpdateUserCommand
  ): Promise<Admin.AdminUserDetail> {
    // Role changes are a privileged operation reserved for superusers.
    if (command.role !== undefined && requesterRole !== 'superuser') {
      respondError('ForbiddenRoleChange', 403, 'Only superusers can change a user role')
    }

    const fields = this.buildUpdateFields(command)
    if (Object.keys(fields).length === 0) {
      respondError('NoFieldsToUpdate', 400, 'No fields provided to update')
    }

    try {
      const updated = await this.userRepository.adminUpdateUser(id, fields)
      if (!updated) respondError('user-not-found', 404, 'User not found')
    } catch (error) {
      if (error instanceof UserRepositoryError && error.code === 'NicknameAlreadyTaken') {
        respondError('NicknameUnavailable', 400, 'This nickname is already taken')
      }
      throw error
    }

    return this.getUser(id)
  }

  /** Maps an admin update command into the corresponding (snake_case) user columns. */
  private buildUpdateFields(command: Admin.UpdateUserCommand): Partial<UserRow> {
    const fields: Partial<UserRow> = {}

    if (command.nickname !== undefined) {
      fields.profile_nickname = command.nickname
      fields.profile_nickname_slug = this.userRepository.slugify(command.nickname)
    }
    if (command.summonerIcon !== undefined) {
      fields.profile_icon = command.summonerIcon
    }
    if (command.role !== undefined) {
      fields.role = command.role
    }
    if (command.rank !== undefined) {
      fields.rank_league = (command.rank.league as LeagueEnum | null) ?? null
      fields.rank_division = command.rank.division
      fields.rank_lp = command.rank.lp
    }
    if (command.credits !== undefined) {
      fields.credits = command.credits
    }
    if (command.xp !== undefined) {
      fields.xp = command.xp
    }
    if (command.stats !== undefined) {
      fields.stats_victories = command.stats.wins
      fields.stats_draws = command.stats.draws
      fields.stats_defeats = command.stats.defeats
    }

    return fields
  }

  private toListItem(row: AdminUserRow): Admin.AdminUserListItem {
    return {
      id: row.id,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      role: row.role,
      email: row.email,
      rank: this.toClientRank(row),
      mmrScore: row.mmr_score,
      createdAt: row.created_at.toISOString(),
    }
  }

  private toDetail(row: AdminUserRow, ownedIcons: number[]): Admin.AdminUserDetail {
    return {
      id: row.id,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      role: row.role,
      email: row.email,
      credits: row.credits,
      xp: row.xp,
      rank: this.toClientRank(row),
      mmrScore: row.mmr_score,
      mmrKFactor: row.mmr_k_factor,
      rankMatches: row.rank_matches,
      stats: {
        wins: row.stats_victories,
        draws: row.stats_draws,
        defeats: row.stats_defeats,
      },
      ownedIcons,
      createdAt: row.created_at.toISOString(),
      nicknameChangedAt: row.profile_nickname_date.toISOString(),
    }
  }

  private toIconItem(row: IconRow): Admin.IconCatalogueItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      yearReleased: row.year_released,
      rarity: row.rarity,
      isLegacy: row.is_legacy,
    }
  }

  private toClientRank(row: AdminUserRow) {
    return {
      league: row.rank_league as League | null,
      division: row.rank_division as Division | null,
      lp: row.rank_lp,
    }
  }
}
