import { Injectable, Logger } from '@nestjs/common'
import { respondError } from '@/common'
import { UserRepository } from '@/infra/database'

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name, { timestamp: true })

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Ban a user either temporarily or permanently
   * @param userId - The ID of the user to ban
   * @param adminId - The ID of the admin performing the ban
   * @param reason - The reason for the ban
   * @param durationMinutes - Duration in minutes (undefined for permanent ban)
   * @returns The date when the ban expires, or undefined for permanent bans
   */
  async banUser(
    userId: string,
    adminId: string,
    reason: string,
    durationMinutes?: number
  ): Promise<Date | undefined> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      respondError('not-found', 404, 'User not found')
    }

    if (user.data.role === 'creator') {
      respondError('forbidden', 403, 'Cannot ban a creator')
    }

    const bannedAt = new Date()
    const expiresAt = durationMinutes
      ? new Date(bannedAt.getTime() + durationMinutes * 60000)
      : new Date(0)

    await this.userRepository.set(userId, {
      ...user.data,
      ban: {
        isBanned: true,
        reason,
        bannedAt,
        expiresAt,
        bannedBy: adminId,
      },
    })

    this.logger.log(
      `User ${user.data.identification.nickname} (${userId}) was ${expiresAt ? 'temporarily' : 'permanently'} banned by admin ${adminId}. Reason: ${reason}`
    )

    return expiresAt
  }

  /**
   * Unban a user
   * @param userId - The ID of the user to unban
   */
  async unbanUser(userId: string): Promise<void> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      respondError('not-found', 404, 'User not found')
    }

    if (!user.data.ban?.isBanned) {
      respondError('bad-request', 400, 'User is not banned')
    }

    await this.userRepository.set(userId, {
      ...user.data,
      ban: {
        ...user.data.ban,
        isBanned: false,
      },
    })

    this.logger.log(`User ${user.data.identification.nickname} (${userId}) was unbanned`)
  }

  /**
   * Check if a user is currently banned
   * @param userId - The ID of the user to check
   * @returns true if the user is banned, false otherwise
   */
  async isUserBanned(userId: string): Promise<boolean> {
    const user = await this.userRepository.getById(userId)
    if (!user || !user.data.ban) return false

    const ban = user.data.ban

    // If not marked as banned, return false
    if (!ban.isBanned) return false

    // If it's a permanent ban (no expiration date), return true
    if (!ban.expiresAt) return true

    // Check if temporary ban has expired
    if (new Date() > ban.expiresAt) {
      // Auto-unban if the ban has expired
      await this.userRepository.set(userId, {
        ...user.data,
        ban: {
          ...ban,
          isBanned: false,
        },
      })
      return false
    }

    return true
  }
}
