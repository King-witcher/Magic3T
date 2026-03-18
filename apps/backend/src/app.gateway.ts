import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { BaseGateway } from '@/common/websocket/base.gateway'
import { SkipAuth } from './modules/auth/decorators/skip-auth.decorator'
import { CORS_ALLOWED_ORIGINS } from './shared/constants/cors'

@WebSocketGateway({ cors: { origin: CORS_ALLOWED_ORIGINS, credentials: true } })
@SkipAuth()
export class AppGateway extends BaseGateway {
  constructor() {
    super('')
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    client.emit('pong', body)
  }
}
