import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { respondError } from '@/common'
import { AuthenticRequest } from '../authentic-request'
import { AuthenticSocket } from '../authentic-socket'

export const SessionId = createParamDecorator((_, ctx: ExecutionContext): string | undefined => {
  switch (ctx.getType()) {
    case 'http': {
      const request = ctx.switchToHttp().getRequest<AuthenticRequest>()
      return request.headers.authorization
    }

    case 'ws': {
      const client = ctx.switchToWs().getClient<AuthenticSocket>()
      return client.handshake.auth.token
    }

    default:
      respondError(
        'NotImplemented',
        501,
        'SessionId decorator is not implemented for this context type.'
      )
  }
})
