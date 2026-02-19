import {
  GameClientEventsMap,
  GameServerEventsMap,
  MatchClientEvents,
  MatchError,
  MatchServerEvents,
  MessagePayload,
} from '@magic3t/api-types'
import { Choice } from '@magic3t/common-types'
import { UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { ChoicePipe } from '@/common'
import { BanGuard } from '@/common/guards'
import { BaseGateway } from '@/common/websocket/base.gateway'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { UserId } from '@/modules/auth/user-id.decorator'
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'
import { AuthGuard } from '../auth'
import { CurrentPerspective } from './decorators'
import { Perspective } from './lib'
import { MatchGuard } from './match.guard'
import { MatchService } from './match.service'
import { MatchSocket } from './types'
import { matchException } from './types/match-error'

const MAX_MESSAGE_LENGTH = 500

@UseGuards(AuthGuard, BanGuard, MatchGuard)
@WebSocketGateway({ cors: { origin: CORS_ALLOWED_ORIGINS, credentials: true }, namespace: 'match' })
export class MatchGateway extends BaseGateway<GameClientEventsMap, GameServerEventsMap, 'match'> {
  constructor(
    private matchService: MatchService,
    private websocketEmitterService: WebsocketEmitterService
  ) {
    super('match')
  }

  @SubscribeMessage(MatchClientEvents.Surrender)
  handleForfeit(@CurrentPerspective() perspective: Perspective) {
    perspective.surrender()
  }

  @SubscribeMessage(MatchClientEvents.GetState)
  handleGetStatus(
    @CurrentPerspective() perspective: Perspective,
    @ConnectedSocket() client: MatchSocket
  ) {
    client.emit(MatchServerEvents.StateReport, perspective.getStateReport())
  }

  @SubscribeMessage(MatchClientEvents.Message)
  handleMessage(@UserId() uid: string, @MessageBody() body: unknown) {
    // Validate message type and length
    if (!body || typeof body !== 'string' || body.length > MAX_MESSAGE_LENGTH) {
      return
    }

    const opponent = this.matchService.getOpponent(uid)
    if (!opponent) matchException(MatchError.MatchNotFound)

    // Sanitize message content
    const sanitizedMessage = body.trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!sanitizedMessage) return

    const messageData: MessagePayload = {
      message: sanitizedMessage,
      sender: uid,
      time: Date.now(),
    }

    this.websocketEmitterService.send(opponent, 'match', MatchServerEvents.Message, messageData)
    this.websocketEmitterService.send(uid, 'match', MatchServerEvents.Message, messageData)
  }

  @SubscribeMessage(MatchClientEvents.GetAssignments)
  async getOpponent(
    @CurrentPerspective() perspective: Perspective,
    @ConnectedSocket() socket: MatchSocket
  ) {
    const assignments = await perspective.getAssignments()
    socket.emit(MatchServerEvents.Assignments, assignments)
  }

  @SubscribeMessage(MatchClientEvents.Pick)
  async handleChoice(
    @CurrentPerspective() adapter: Perspective,
    @MessageBody(ChoicePipe) choice: Choice
  ) {
    adapter.pick(choice)
  }
}
