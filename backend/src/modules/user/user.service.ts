import { GetUserResult, ListUsersResult, ListUsersResultData } from '@magic3t/api-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { range } from 'lodash'
import { respondError, unexpected } from '@/common'
import { ConfigService } from '@/infra'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { UserRepositoryError } from '@/infra/database/repositories/user-repository-error'
import { RankConverter } from '@/modules/rating'

const BASE_ICONS = new Set([...range(0, 30)])
const MIN_RANKED_MATCHES = 5
const NICKNAME_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

@Injectable()
export class UserService {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository
  ) {}

  async getByUUID(uuid: string): Promise<GetUserResult> {
    const row = await this.userRepository.getByUUID(uuid)
    if (!row) respondError('user-not-found', 404, 'User not found')
    return this.toGetUserResult(row)
  }

  async getByNickname(nickname: string): Promise<GetUserResult> {
    const row = await this.userRepository.getByNickname(nickname)
    if (!row) respondError('user-not-found', 404, 'User not found')
    return this.toGetUserResult(row)
  }

  async getLeaderboard(): Promise<ListUsersResult> {
    const rows = await this.userRepository.getLeaderboard(MIN_RANKED_MATCHES, 10)
    return {
      data: await Promise.all(rows.map((row) => this.toListedUserResult(row))),
    }
  }

  async getProfile(userId: number): Promise<GetUserResult> {
    const user = await this.userRepository.getById(userId)
    if (!user) unexpected('UserNotFound', 'User not found for current session')
    return this.toGetUserResult(user)
  }

  async changeNickname(userId: number, newNickname: string): Promise<void> {
    const user = await this.userRepository.getById(userId)
    if (!user) respondError('UserNotFound', 404, 'User not found')

    const timeSinceLastChange = Date.now() - user.profile_nickname_date.getTime()
    if (timeSinceLastChange < NICKNAME_COOLDOWN_MS) {
      respondError('NicknameChangeCooldown', 400, 'Nickname can only be changed every 30 days')
    }

    if (user.profile_nickname === newNickname) {
      respondError('SameNickname', 400, 'New nickname is the same as the current one')
    }

    try {
      await this.userRepository.updateNickname(userId, newNickname)
    } catch (error) {
      if (error instanceof UserRepositoryError && error.code === 'NicknameAlreadyTaken') {
        respondError('NicknameUnavailable', 400, 'This nickname is already taken')
      }
      throw error
    }
  }

  async getAvailableIcons(userId: number): Promise<number[]> {
    const icons = await this.userRepository.getUserIcons(userId)
    const assignedIcons = icons.map((icon) => icon.id)
    return [...assignedIcons, ...BASE_ICONS]
  }

  async changeIcon(userId: number, iconId: number): Promise<void> {
    if (!BASE_ICONS.has(iconId)) {
      const userIcons = await this.userRepository.getUserIcons(userId)
      if (!userIcons.some((assignment) => assignment.id === iconId)) {
        respondError('icon-unavailable', 400, 'The user does not own this icon')
      }
    }

    await this.userRepository.updateIcon(userId, iconId)
  }

  private async toGetUserResult(row: UserRow): Promise<GetUserResult> {
    const ratingConfig = await this.configService.ratingConfig
    const ratingService = new RankConverter(ratingConfig)
    const rank = ratingService.getRankFromElo(
      row.rating_score,
      row.rating_ranked_count,
      row.rating_apex_flag
    )

    return {
      uuid: row.uuid,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      stats: {
        wins: row.stats_victories,
        draws: row.stats_draws,
        defeats: row.stats_defeats,
      },
      rank,
    }
  }

  private async toListedUserResult(row: UserRow): Promise<ListUsersResultData> {
    const ratingConfig = await this.configService.ratingConfig
    const ratingService = new RankConverter(ratingConfig)
    const rank = ratingService.getRankFromElo(
      row.rating_score,
      row.rating_ranked_count,
      row.rating_apex_flag
    )

    return {
      uuid: row.uuid,
      role: row.role,
      nickname: row.profile_nickname,
      summonerIcon: row.profile_icon,
      rank,
    }
  }
}
