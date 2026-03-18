import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { respondError } from '@/common'
import { Perspective } from '../lib'
import { MatchSocket } from '../types'
import { MatchRequest } from '../types/match-request'

export const CurrentPerspective = createParamDecorator((_, ctx: ExecutionContext): Perspective => {
  switch (ctx.getType()) {
    case 'http': {
      const request = ctx.switchToHttp().getRequest<MatchRequest>()
      return request.perspective
    }
    case 'ws': {
      const client = ctx.switchToWs().getClient<MatchSocket>()
      return client.data.perspective
    }
    case 'rpc':
      respondError(
        'invalid-request',
        400,
        'CurrentPerspective decorator is not implemented for rpc context.'
      )
  }
})
