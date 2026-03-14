import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { respondError, unexpected } from '@/common'
import { AuthenticRequest } from '../authentic-request'
import { AuthenticSocket } from '../authentic-socket'

/**
 * Retrieves the current signed-in user's ID.
 *
 * Should be used in conjunction with authentication guards that populate the session data.
 */
export const UserId = createParamDecorator((_, ctx: ExecutionContext): number | undefined => {
  switch (ctx.getType()) {
    case 'http': {
      const request = ctx.switchToHttp().getRequest<AuthenticRequest>()
      const id = request.session?.id
      if (id === undefined) {
        unexpected(
          'InvalidSession',
          'UserId decorator should be used with authenticated routes, but no session ID was found.'
        )
      }
      return id
    }

    case 'ws': {
      const client = ctx.switchToWs().getClient<AuthenticSocket>()
      const id = client.data.session?.id
      if (id === undefined) {
        unexpected(
          'InvalidSession',
          'UserId decorator should be used with authenticated routes, but no session ID was found.'
        )
      }
      return id
    }

    default:
      respondError(
        'not-implemented',
        501,
        'UserId decorator is not implemented for this context type.'
      )
  }
})
