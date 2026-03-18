import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { respondError, unexpected } from '@/common'
import { MatchStore } from './lib'
import { MatchSocket } from './types'
import { MatchRequest } from './types/match-request'

@Injectable()
export class MatchGuard implements CanActivate {
  private readonly logger = new Logger(MatchGuard.name, { timestamp: true })

  constructor(private readonly matchBank: MatchStore) {}

  canActivate(context: ExecutionContext) {
    try {
      switch (context.getType()) {
        case 'http': {
          const request = context.switchToHttp().getRequest<MatchRequest>()
          return this.validateHttp(request)
        }
        case 'ws': {
          const client = context.switchToWs().getClient<MatchSocket>()
          return this.validateWs(client)
        }
        case 'rpc':
          respondError('not-supported', 400)
      }
    } catch (e) {
      this.logger.error(`request rejected: ${(<Error>e).message}`)
      return false
    }
  }

  private validateHttp(request: MatchRequest): boolean {
    const uuid = request.session.uuid
    if (!uuid) return false

    const perspective = this.matchBank.getPerspective(uuid)
    if (!perspective) respondError('not-in-match', 400)

    request.perspective = perspective
    return true
  }

  private validateWs(socket: MatchSocket): boolean {
    const uuid = socket.data.session.uuid
    if (!uuid) unexpected('unauthenticated socket connection.')

    const perspective = this.matchBank.getPerspective(uuid)
    if (!perspective) respondError('not-in-match', 400)

    socket.data.perspective = perspective
    return true
  }
}
