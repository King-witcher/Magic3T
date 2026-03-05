import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { respondError } from '@/common'
import { SessionData } from '@/shared/types/session-data'
import { AuthenticRequest } from '../authentic-request'
import { AuthenticSocket } from '../authentic-socket'

export const Session = createParamDecorator((_, ctx: ExecutionContext): SessionData => {
  switch (ctx.getType()) {
    case 'http': {
      const request = ctx.switchToHttp().getRequest<AuthenticRequest>()
      return request.session
    }

    case 'ws': {
      const client = ctx.switchToWs().getClient<AuthenticSocket>()
      return client.data.session
    }

    default:
      respondError(
        'NotImplemented',
        501,
        'Session decorator is not implemented for this context type.'
      )
  }
})
