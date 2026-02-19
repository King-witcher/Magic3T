import { BanUserResponse } from '@magic3t/api-types'
import { BanRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { respondError } from '@/common'
import { BanRepository, UserRepository } from '@/infra/database'

@Injectable()
export class BanService {
  constructor(
    private readonly banRepository: BanRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   * Check if a user is currently banned
   */
  async isUserBanned(userId: string): Promise<boolean> {
    const ban = await this.banRepository.getActiveBansForUser(userId)
    return ban !== null
  }

  /**
   * Get active ban information for a user
   */
  async getActiveBanForUser(userId: string): Promise<BanRow | null> {
    return this.banRepository.getActiveBansForUser(userId)
  }

  /**
   * Ban a user with temporary or permanent ban
   */
  async banUser(
    bannedUserId: string,
    creatorId: string,
    isPermanent: boolean,
    reason: string,
    durationMs?: number
  ): Promise<BanUserResponse> {
    // Check if user exists
    const bannedUser = await this.userRepository.getById(bannedUserId)
    if (!bannedUser) {
      respondError('user-not-found', 404, 'User to ban not found')
    }

    // Check if already banned
    const existingBan = await this.banRepository.getActiveBansForUser(bannedUserId)
    if (existingBan) {
      respondError('user-already-banned', 400, 'User is already banned')
    }

    // Create the ban
    await this.banRepository.banUser(
      bannedUserId,
      bannedUser!.data.identification.nickname,
      creatorId,
      isPermanent,
      reason,
      durationMs
    )

    const expiresAt = !isPermanent && durationMs ? new Date(Date.now() + durationMs) : null

    return {
      userId: bannedUserId,
      nickname: bannedUser!.data.identification.nickname,
      isPermanent,
      expiresAt,
      reason,
    }
  }

  /**
   * Unban a user (remove all bans)
   */
  async unbanUser(userId: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.getById(userId)
    if (!user) {
      respondError('user-not-found', 404, 'User not found')
    }

    // Check if actually banned
    const activeBan = await this.banRepository.getActiveBansForUser(userId)
    if (!activeBan) {
      respondError('user-not-banned', 400, 'User is not currently banned')
    }

    await this.banRepository.unbanUser(userId)
  }

  /**
   * List all active bans
   */
  async listActiveBans(): Promise<BanUserResponse[]> {
    const bans = await this.banRepository.getAllActiveBans()

    return bans.map((ban) => ({
      userId: ban.banned_user_id,
      nickname: ban.banned_user_nickname,
      isPermanent: ban.is_permanent,
      expiresAt: ban.expires_at,
      reason: ban.reason,
    }))
  }
}
