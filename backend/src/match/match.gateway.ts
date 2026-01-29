import {
  GameServerEventsMap,
  MatchClientEvents,
  MatchError,
  MatchServerEvents,
  MessagePayload,
} from '@magic3t/api-types'
import { Choice } from '@magic3t/common-types'
import { Inject, Logger, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { AuthGuard } from '@/auth/auth.guard'
import { UserId } from '@/auth/user-id.decorator'
import { ChoicePipe, SocketsService } from '@/common'
import { CurrentPerspective } from './decorators'
import { Perspective } from './lib'
import { MatchGuard } from './match.guard'
import { MatchService } from './match.service'
import { MatchSocket } from './types'
import { matchException } from './types/match-error'

const MAX_MESSAGE_LENGTH = 500

const ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',
]

@UseGuards(AuthGuard, MatchGuard)
@WebSocketGateway({ cors: { origin: ALLOWED_ORIGINS, credentials: true }, namespace: 'match' })
export class MatchGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(MatchGateway.name, { timestamp: true })

  constructor(
    @Inject('MatchSocketsService')
    private socketsService: SocketsService<GameServerEventsMap>,
    private matchService: MatchService
  ) {}

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

    this.socketsService.send(opponent, MatchServerEvents.Message, messageData)
    this.socketsService.send(uid, MatchServerEvents.Message, messageData)
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

  handleDisconnect(client: MatchSocket) {
    const userId = client.data.userId
    if (userId) {
      this.logger.log(`user ${userId} disconnected`)
      this.socketsService.remove(userId, client)
    }
  }
}
