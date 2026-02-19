import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { respondError } from '@/common'
import { UserRepository } from '@/infra/firestore'
import { AuthenticRequest } from '@/modules/auth/auth-request'
import { AuthenticSocket } from '@/modules/auth/auth-socket'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext) {
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
        respondError('not-implemented', 501, 'Auth guard not implemented for this context type')
      }
    }

    if (!userId) return false
    const user = await this.userRepository.getById(userId)
    if (!user) return false
    if (user.data.role === 'creator') return true
    return false
  }
}
