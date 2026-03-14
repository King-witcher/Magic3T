import { Inject, UseFilters, UseGuards } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { OnGatewayConnection, OnGatewayInit, WebSocketServer } from '@nestjs/websockets'
import { EventNames, EventParams, EventsMap } from '@socket.io/component-emitter'
import { DefaultEventsMap, Namespace, Server, Socket } from 'socket.io'
import { UserRepository } from '@/infra/database/repositories/user-repository'
import { WebsocketEmitterEvent } from '@/infra/websocket/types'
import { WebsocketCountingService } from '@/infra/websocket/websocket-counting.service'
import { SKIP_AUTH_KEY } from '@/modules/auth'
import { AuthSessionService } from '@/modules/auth/auth-session.service'
import { AuthenticSocket } from '@/modules/auth/authentic-socket'
import { SessionData } from '@/shared/types/session-data'
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

  @Inject(AuthSessionService)
  protected readonly authService: AuthSessionService
  @Inject(UserRepository)
  protected readonly userRepository: UserRepository
  @Inject(WebsocketCountingService)
  protected readonly websocketCountingService: WebsocketCountingService

  constructor(public readonly namespace: TNamespace) {}

  afterInit() {
    if (this.server instanceof Server) this.ioNamespace = this.server.of(this.namespace)
    else if (this.server instanceof Namespace) this.ioNamespace = this.server
    else unexpected('WebSocketServer is not initialized properly.')
    this.websocketCountingService.setServer(this.namespace, this.ioNamespace)
  }

  // Validate authentication on connection
  async handleConnection(client: Socket) {
    const skipAuth = Reflect.getMetadata(SKIP_AUTH_KEY, this.constructor)
    if (skipAuth) return
    const session = await this.requireAuth(client)

    if (session) {
      await this.joinRoom(client)
    }
  }

  /** Send an event to a specific user in a namespace. */
  send<TEvent extends EventNames<TServer>>(
    uuid: string,
    event: TEvent,
    ...data: EventParams<TServer, TEvent>
  ) {
    const room: RoomName<TNamespace> = `user:${uuid}@${this.namespace}`
    this.ioNamespace?.to(room).emit(event, ...data)
  }

  /** Send an event to all users in a namespace. */
  broadcast<TEvent extends Parameters<Namespace<TClient, TServer>['emit']>[0]>(
    event: TEvent,
    ...data: EventParams<TServer, TEvent>
  ) {
    this.ioNamespace?.emit(event, ...data)
  }

  @OnEvent('websocket.emit')
  handleWebsocketEmitEvent(event: WebsocketEmitterEvent) {
    if (event.namespace !== this.namespace) return

    if (!event.uuid) {
      this.broadcast(event.event, ...event.data)
    } else {
      this.send(event.uuid, event.event, ...event.data)
    }
  }

  private async requireAuth(client: Socket): Promise<SessionData | null> {
    const token = client.handshake.auth.token
    let session: SessionData | null = null
    if (token && typeof token === 'string') {
      session = await this.authService.getSession(token)
    }

    // If user is not authenticated, disconnect
    if (!session) {
      client.send('error', {
        errorCode: 'unauthorized',
      })
      client.disconnect()
      return null
    }

    // Attach user ID to the socket data
    const authClient = client as AuthenticSocket
    authClient.data.session = session
    return session
  }

  private async joinRoom(client: AuthenticSocket) {
    const session = client.data.session
    const roomName = `user:${session.uuid}@${this.namespace}`
    client.join(roomName)
  }
}
