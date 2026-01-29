import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'

const ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',
]

@WebSocketGateway({ cors: { origin: ALLOWED_ORIGINS, credentials: true } })
export class AppGateway {
  @SubscribeMessage('ping')
  handlePing(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    client.emit('pong', body)
  }
}
