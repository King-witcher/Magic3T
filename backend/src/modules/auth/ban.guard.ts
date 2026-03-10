import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { respondError } from '@/common'
import { AuthenticRequest } from './auth-request'
import { AuthenticSocket } from './auth-socket'
import { BanService } from './ban.service'

/**
 * Guard that checks if the user is banned.
 * Should be used after AuthGuard to ensure the user is authenticated first.
 */
@Injectable()
export class BanGuard implements CanActivate {
  private readonly logger = new Logger(BanGuard.name, { timestamp: true })

  constructor(private readonly banService: BanService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let userId: string | undefined

    switch (context.getType()) {
      case 'http': {
        const request = context.switchToHttp().getRequest<AuthenticRequest>()
        userId = request.userId
        break
      }
      case 'ws': {
        const socket = context.switchToWs().getClient<AuthenticSocket>()
        userId = socket.data.userId
        break
      }
      default: {
        respondError('not-implemented', 501, 'Ban guard not implemented for this context type')
      }
    }

    if (!userId) return false

    const banStatus = await this.banService.checkBanStatus(userId)
    if (banStatus) {
      const expiresAt = banStatus.expires_at
        ? banStatus.expires_at instanceof Date
          ? banStatus.expires_at.toISOString()
          : banStatus.expires_at
        : undefined

      this.logger.warn(`Banned user ${userId} attempted to access protected resource`)

      respondError('user-banned', 403, {
        type: banStatus.type,
        reason: banStatus.reason,
        expiresAt,
      })
    }

    return true
  }
}
