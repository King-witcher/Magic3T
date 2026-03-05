import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { respondError } from '@/common'
import { AuthenticRequest } from '../authentic-request'
import { AuthenticSocket } from '../authentic-socket'

export const UserId = createParamDecorator((_, ctx: ExecutionContext): number => {
  switch (ctx.getType()) {
    case 'http': {
      const request = ctx.switchToHttp().getRequest<AuthenticRequest>()
      return request.session.id
    }

    case 'ws': {
      const client = ctx.switchToWs().getClient<AuthenticSocket>()
      return client.data.session.id
    }

    default:
      respondError(
        'not-implemented',
        501,
        'UserId decorator is not implemented for this context type.'
      )
  }
})
