import { UserBanType } from '@magic3t/database-types'
import { Inject, UseFilters, UseGuards } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { OnGatewayConnection, OnGatewayInit, WebSocketServer } from '@nestjs/websockets'
import { EventNames, EventParams, EventsMap } from '@socket.io/component-emitter'
import { DefaultEventsMap, Namespace, Server, Socket } from 'socket.io'
import { UserRepository } from '@/infra/database'
import { WebsocketEmitterEvent } from '@/infra/websocket/types'
import { WebsocketCountingService } from '@/infra/websocket/websocket-counting.service'
import { AuthService } from '@/modules/auth/auth.service'
import { AuthenticSocket } from '@/modules/auth/auth-socket'
import { SKIP_AUTH_KEY } from '@/modules/auth/skip-auth.decorator'
import { NamespacesMap, RoomName } from '@/shared/websocket/namespaces-map'
import { unexpected } from '../errors'
import { ResponseErrorFilter, ThrottlingFilter, UnexpectedErrorFilter } from '../filters'
import { WsThrottlerGuard } from '../guards/ws-throttler.guard'

@UseFilters(UnexpectedErrorFilter, ResponseErrorFilter, ThrottlingFilter)
@UseGuards(WsThrottlerGuard)
export class BaseGateway<
  TClient extends EventsMap = DefaultEventsMap,
  TServer extends EventsMap = DefaultEventsMap,
  TNamespace extends keyof NamespacesMap = '',
> implements OnGatewayConnection, OnGatewayInit
{
  @WebSocketServer()
  private server?: Server<TClient, TServer> | Namespace<TClient, TServer>
  private ioNamespace?: Namespace<TClient, TServer>

  @Inject(AuthService)
  protected readonly authService: AuthService
  @Inject(UserRepository)
  protected readonly usersRepository: UserRepository
  @Inject(WebsocketCountingService)
  protected readonly websocketCountingService: WebsocketCountingService

  constructor(public readonly namespace: TNamespace) {}

  afterInit() {
    if (this.server instanceof Server) this.ioNamespace = this.server.of(this.namespace)
    else if (this.server instanceof Namespace) this.ioNamespace = this.server
    else unexpected('WebSocketServer is not initialized properly.')
    this.websocketCountingService.setServer(this.namespace, this.ioNamespace)
  }

  /** Send an event to a specific user in a namespace. */
  send<TEvent extends EventNames<TServer>>(
    userId: string,
    event: TEvent,
    ...data: EventParams<TServer, TEvent>
  ) {
    const room: RoomName<TNamespace> = `user:${userId}@${this.namespace}`
    this.ioNamespace?.to(room).emit(event, ...data)
  }

  /** Send an event to all users in a namespace. */
  broadcast<TEvent extends Parameters<Namespace<TClient, TServer>['emit']>[0]>(
    event: TEvent,
    ...data: EventParams<TServer, TEvent>
  ) {
    this.ioNamespace?.emit(event, ...data)
  }

  // Validate authentication on connection
  async handleConnection(client: Socket) {
    const skipAuth = Reflect.getMetadata(SKIP_AUTH_KEY, this.constructor)
    if (skipAuth) return

    const token = client.handshake.auth.token
    let userId: string | null = null
    if (token && typeof token === 'string') {
      userId = await this.authService.validateToken(token)
    }

    // If user is not authenticated, disconnect
    if (!userId) {
      client.send('error', {
        errorCode: 'unauthorized',
      })
      client.disconnect()
      return
    }

    const user = await this.usersRepository.getById(userId)
    if (user?.data.ban) {
      const ban = user.data.ban

      if (ban.type === UserBanType.Permanent) {
        client.send('error', {
          errorCode: 'user-banned',
          metadata: {
            type: ban.type,
            reason: ban.reason,
            createdAt: ban.created_at,
          },
        })
        client.disconnect()
        return
      }

      const expiresAt = ban.expires_at
      if (!expiresAt || !(expiresAt instanceof Date)) {
        client.send('error', {
          errorCode: 'user-banned',
          metadata: {
            type: ban.type,
            reason: ban.reason,
            createdAt: ban.created_at,
          },
        })
        client.disconnect()
        return
      }

      if (expiresAt.getTime() > Date.now()) {
        client.send('error', {
          errorCode: 'user-banned',
          metadata: {
            type: ban.type,
            reason: ban.reason,
            createdAt: ban.created_at,
            expiresAt,
          },
        })
        client.disconnect()
        return
      }

      await this.usersRepository.clearBan(userId)
    }

    // Attach user ID to the socket data
    const authClient = client as AuthenticSocket
    authClient.data.userId = userId

    // Join user-specific room
    const roomName = `user:${userId}@${this.namespace}`
    client.join(roomName)
  }

  @OnEvent('websocket.emit')
  handleWebsocketEmitEvent(event: WebsocketEmitterEvent) {
    if (event.namespace !== this.namespace) return

    if (!event.userId) {
      this.broadcast(event.event, ...event.data)
    } else {
      this.send(event.userId, event.event, ...event.data)
    }
  }
}
