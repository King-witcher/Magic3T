import { UserRole } from '@magic3t/common-types'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { respondError } from '@/common'
import { AuthenticSocket } from '@/modules/auth'

const ALLOWED: UserRole[] = ['admin', 'superuser']
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    let role: UserRole | undefined

    switch (context.getType()) {
      case 'http': {
        const request = context.switchToHttp().getRequest<Request>()
        role = request.session?.role
        break
      }
      case 'ws': {
        const socket = context.switchToWs().getClient<AuthenticSocket>()
        role = socket.data.session?.role
        break
      }
      default: {
        respondError('not-implemented', 501, 'Auth guard not implemented for this context type')
      }
    }

    if (!role) return false

    return ALLOWED.includes(role)
  }
}
