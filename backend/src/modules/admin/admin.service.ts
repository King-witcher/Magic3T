import { BanUserCommand, BanUserResult, UnbanUserResult } from '@magic3t/api-types'
import { UserRowBan } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { respondError } from '@/common'
import { UserRepository } from '@/infra/database'
import { BanService } from '@/modules/auth/ban.service'

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name, { timestamp: true })

  constructor(
    private readonly userRepository: UserRepository,
    private readonly banService: BanService
  ) {}

  /**
   * Bans a user either permanently or temporarily.
   */
  async banUser(command: BanUserCommand, issuedBy: string): Promise<BanUserResult> {
    const { userId, type, reason, duration } = command

    // Validate input
    if (type === 'temporary' && !duration) {
      respondError('invalid-ban-duration', 400, 'Duration is required for temporary bans')
    }

    if (type === 'temporary' && duration && duration <= 0) {
      respondError('invalid-ban-duration', 400, 'Duration must be a positive number')
    }

    // Check if user exists
    const user = await this.userRepository.getById(userId)
    if (!user) {
      respondError('user-not-found', 404, 'User not found')
    }

    // Prevent banning creators
    if (user.data.role === 'creator') {
      respondError('cannot-ban-creator', 403, 'Cannot ban a creator')
    }

    // Prevent self-ban
    if (userId === issuedBy) {
      respondError('cannot-ban-self', 403, 'Cannot ban yourself')
    }

    const now = new Date()
    const ban: UserRowBan = {
      type,
      reason,
      issued_at: now,
      issued_by: issuedBy,
    }

    if (type === 'temporary' && duration) {
      ban.expires_at = new Date(now.getTime() + duration * 1000)
    }

    await this.userRepository.update(userId, { ban })

    this.logger.log(
      `User ${userId} was ${type === 'permanent' ? 'permanently' : `temporarily (${duration}s)`} banned by ${issuedBy}. Reason: ${reason}`
    )

    return {
      success: true,
      userId,
      type,
      expiresAt: ban.expires_at?.toISOString(),
    }
  }

  /**
   * Removes a ban from a user.
   */
  async unbanUser(userId: string, unbannedBy: string): Promise<UnbanUserResult> {
    // Check if user exists
    const user = await this.userRepository.getById(userId)
    if (!user) {
      respondError('user-not-found', 404, 'User not found')
    }

    // Check if user is actually banned
    if (!user.data.ban) {
      respondError('user-not-banned', 400, 'User is not banned')
    }

    await this.userRepository.update(userId, { ban: null as unknown as undefined })

    this.logger.log(`User ${userId} was unbanned by ${unbannedBy}`)

    return {
      success: true,
      userId,
    }
  }

  /**
   * Checks if a user is currently banned.
   * Returns the ban info if banned, null otherwise.
   * Automatically clears expired temporary bans.
   */
  async checkBanStatus(userId: string): Promise<UserRowBan | null> {
    return this.banService.checkBanStatus(userId)
  }
}
