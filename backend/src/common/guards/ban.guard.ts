import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { respondError } from '@/common'
import { AdminService } from '@/modules/admin/admin.service'
import { AuthenticRequest } from '@/modules/auth/auth-request'
import { AuthenticSocket } from '@/modules/auth/auth-socket'

/**
 * Guard that blocks banned users from accessing endpoints
 */
@Injectable()
export class BanGuard implements CanActivate {
  constructor(private readonly adminService: AdminService) {}

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

    const isBanned = await this.adminService.isUserBanned(userId)
    if (isBanned) {
      respondError('forbidden', 403, 'User is banned')
    }

    return true
  }
}
