import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { respondError } from '@/common'
import { BanRepository } from '@/infra/database'

interface AuthenticRequest {
  userId?: string
  headers: Record<string, string | string[]>
}

interface AuthenticSocket {
  data: {
    userId?: string
  }
}

@Injectable()
export class BanGuard implements CanActivate {
  private readonly logger = new Logger(BanGuard.name)

  constructor(private readonly banRepository: BanRepository) {}

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
        return true
      }
    }

    if (!userId) return true // No user ID, let other guards handle it

    const activeBan = await this.banRepository.getActiveBansForUser(userId)
    if (activeBan) {
      const message = activeBan.is_permanent
        ? 'You have been permanently banned from the game'
        : `You have been banned until ${activeBan.expires_at?.toISOString()}`

      this.logger.warn(`Banned user ${userId} attempted to access protected resource`)
      respondError('user-banned', 403, message)
    }

    return true
  }
}
