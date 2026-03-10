import { UserRowBan } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { UserRepository } from '@/infra/database'

/**
 * Service to check ban status of users.
 * Separated from AdminService to avoid circular dependencies.
 */
@Injectable()
export class BanService {
  private readonly logger = new Logger(BanService.name, { timestamp: true })

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Checks if a user is currently banned.
   * Returns the ban info if banned, null otherwise.
   * Automatically clears expired temporary bans.
   */
  async checkBanStatus(userId: string): Promise<UserRowBan | null> {
    const user = await this.userRepository.getById(userId)
    if (!user || !user.data.ban) {
      return null
    }

    const ban = user.data.ban

    // Check if temporary ban has expired
    if (ban.type === 'temporary' && ban.expires_at) {
      const expiresAt = ban.expires_at instanceof Date ? ban.expires_at : new Date(ban.expires_at)
      if (expiresAt <= new Date()) {
        // Ban has expired, remove it
        await this.userRepository.update(userId, { ban: null as unknown as undefined })
        this.logger.log(
          `Temporary ban for user ${userId} has expired and was automatically removed`
        )
        return null
      }
    }

    return ban
  }
}
