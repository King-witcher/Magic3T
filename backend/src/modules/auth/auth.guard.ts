import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Socket } from 'socket.io'
import { respondError } from '@/common'
import { AuthenticRequest } from './authentic-request'
import { SKIP_AUTH_KEY } from './decorators/skip-auth.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name, { timestamp: true })

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const skipAuth = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipAuth) return true

    try {
      switch (context.getType()) {
        case 'http': {
          const request = context.switchToHttp().getRequest<AuthenticRequest>()
          return await this.validateHttp(request)
        }
        case 'ws': {
          const socket = context.switchToWs().getClient<Socket>()
          return await this.validateWs(socket)
        }
        default: {
          respondError('NotImplemented', 501, 'AuthGuard not implemented for this context')
        }
      }
    } catch (e) {
      this.logger.error(`request rejected: ${(<Error>e).message}`)
      return false
    }
  }

  private async validateHttp(request: AuthenticRequest): Promise<boolean> {
    // HTTP authentication is handled by the AuthMiddleware
    return !!request.session
  }

  private async validateWs(socket: Socket): Promise<boolean> {
    // Socket authentication is handled during connection in the Gateway.
    const allowed = !!socket.data?.session
    if (!allowed) this.logger.warn(`unauthenticated socket connection attempt refused`)
    return allowed
  }
}
