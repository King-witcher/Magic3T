# WebSockets - Magic3T Backend

Este documento descreve a arquitetura de WebSockets utilizada no backend do Magic3T.

---

## Visão Geral

O Magic3T utiliza Socket.IO para comunicação em tempo real. A arquitetura é baseada em:

| Componente | Responsabilidade |
|------------|------------------|
| **BaseGateway** | Classe base com autenticação, rate limiting e emissão de eventos |
| **WsThrottlerGuard** | Rate limiting para WebSockets |
| **WebsocketEmitterService** | Emissão de eventos via EventEmitter2 |
| **NamespacesMap** | Tipagem dos namespaces e eventos |

---

## Namespaces

O backend expõe 3 namespaces WebSocket:

| Namespace | Gateway | Propósito |
|-----------|---------|-----------|
| `/` | `AppGateway` | Conexão geral, heartbeat |
| `/queue` | `QueueGateway` | Fila de matchmaking |
| `/match` | `MatchGateway` | Partidas em tempo real |

---

## BaseGateway

A classe `BaseGateway` (`common/websocket/base.gateway.ts`) é a base para todos os gateways WebSocket. Ela fornece:

### Funcionalidades

1. **Autenticação automática** no `handleConnection`
2. **Rate limiting** via `WsThrottlerGuard`
3. **Exception filters** para tratamento de erros
4. **Métodos utilitários** para emissão de eventos

### Estrutura

```typescript
@UseFilters(UnexpectedErrorFilter, ResponseErrorFilter, ThrottlingFilter)
@UseGuards(WsThrottlerGuard)
export class BaseGateway<
  TClient extends EventsMap = DefaultEventsMap,
  TServer extends EventsMap = DefaultEventsMap,
  TNamespace extends keyof NamespacesMap = '',
> implements OnGatewayConnection, OnGatewayInit
{
  constructor(public readonly namespace: TNamespace) {}

  // Inicializa o namespace do Socket.IO
  afterInit() { ... }

  // Autentica conexões
  async handleConnection(client: Socket) { ... }

  // Envia evento para um usuário específico
  send<TEvent>(userId: string, event: TEvent, ...data) { ... }

  // Envia evento para todos os usuários do namespace
  broadcast<TEvent>(event: TEvent, ...data) { ... }

  // Listener para eventos do WebsocketEmitterService
  @OnEvent('websocket.emit')
  handleWebsocketEmitEvent(event: WebsocketEmitterEvent) { ... }
}
```

### Como Usar

Para criar um novo gateway, estenda `BaseGateway`:

```typescript
@WebSocketGateway({
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
  namespace: 'match'
})
export class MatchGateway extends BaseGateway<
  GameClientEventsMap,  // Eventos que o cliente pode enviar
  GameServerEventsMap,  // Eventos que o servidor pode enviar
  'match'               // Nome do namespace
> {
  constructor(private matchService: MatchService) {
    super('match')  // Passa o namespace para a classe base
  }

  @SubscribeMessage('pick')
  handlePick(@UserId() userId: string, @MessageBody() choice: Choice) {
    // Lógica do evento
  }
}
```

---

## Autenticação

### Fluxo de Conexão

```
Cliente                          Servidor
   │                                │
   │──── connect({ auth: token })──►│
   │                                │
   │                     ┌──────────┴──────────┐
   │                     │ BaseGateway         │
   │                     │ .handleConnection() │
   │                     └──────────┬──────────┘
   │                                │
   │                     ┌──────────┴──────────┐
   │                     │ AuthService         │
   │                     │ .validateToken()    │
   │                     └──────────┬──────────┘
   │                                │
   │                         Token válido?
   │                         /          \
   │                       Sim           Não
   │                        │             │
   │         ┌──────────────┴───┐   ┌─────┴─────────┐
   │         │ Attach userId    │   │ Emit 'error'  │
   │         │ Join user room   │   │ Disconnect    │
   │         └──────────────────┘   └───────────────┘
   │                                │
   │◄───── connection established ──│
```

### Rooms por Usuário

Cada usuário autenticado é automaticamente adicionado a uma room única:

```typescript
// Formato: user:{userId}@{namespace}
client.join(`user:${userId}@${this.namespace}`)

// Exemplos:
// - user:abc123@match
// - user:abc123@queue
```

Isso permite enviar eventos para um usuário específico em qualquer namespace.

### Skip Auth

Para endpoints públicos, use o decorator `@SkipAuth()`:

```typescript
import { SkipAuth } from '@/modules/auth'

@SkipAuth()
@WebSocketGateway({ namespace: 'public' })
export class PublicGateway extends BaseGateway { }
```

---

## Rate Limiting

### WsThrottlerGuard

O guard `WsThrottlerGuard` (`common/guards/ws-throttler.guard.ts`) implementa rate limiting para WebSockets:

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } = requestProps

    // Extrai o cliente WebSocket
    const client = context.switchToWs().getClient<Socket>()

    // Identifica pelo IP
    const tracker = client.handshake.address

    // Gera chave única para o contador
    const key = generateKey(context, tracker, throttler.name || 'default')

    // Incrementa contador
    const { isBlocked } = await this.storageService.increment(...)

    // Bloqueia se exceder limite
    if (isBlocked) {
      await this.throwThrottlingException(context, {...})
    }

    return true
  }
}
```

### Configuração

O rate limiting é configurado no `ThrottlerModule` do `AppModule`:

```typescript
ThrottlerModule.forRoot({
  throttlers: [
    { name: 'short', limit: 3, ttl: 1000 },    // 3 req/segundo
    { name: 'medium', limit: 20, ttl: 10000 }, // 20 req/10 segundos
    { name: 'long', limit: 100, ttl: 60000 },  // 100 req/minuto
  ]
})
```

---

## WebsocketEmitterService

O `WebsocketEmitterService` (`infra/websocket/websocket-emitter.service.ts`) permite emitir eventos WebSocket de qualquer parte da aplicação, não apenas dos gateways.

### Problema Resolvido

Em uma aplicação típica, você só consegue emitir eventos WebSocket de dentro de um gateway. Mas às vezes você precisa emitir eventos de:
- Services
- Event handlers
- Controllers

### Solução: EventEmitter2

O `WebsocketEmitterService` usa o `EventEmitter2` do NestJS para desacoplar a emissão:

```
┌─────────────────┐     emit('websocket.emit')     ┌─────────────────┐
│  QueueService   │ ──────────────────────────────►│  EventEmitter2  │
│  (qualquer      │                                └────────┬────────┘
│   lugar)        │                                         │
└─────────────────┘                                         │
                                                   @OnEvent('websocket.emit')
                                                            │
                              ┌──────────────────────────────┼────────────────┐
                              │                              │                │
                              ▼                              ▼                ▼
                      ┌───────────────┐          ┌───────────────┐   ┌───────────────┐
                      │  QueueGateway │          │  MatchGateway │   │   AppGateway  │
                      │  (ouve evento │          │  (ignora se   │   │   (ignora se  │
                      │   e emite)    │          │   namespace   │   │   namespace   │
                      └───────────────┘          │   diferente)  │   │   diferente)  │
                                                 └───────────────┘   └───────────────┘
```

### Como Usar

```typescript
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'

@Injectable()
export class QueueService {
  constructor(private websocketEmitter: WebsocketEmitterService) {}

  async matchFound(userId: string, matchId: string) {
    // Emite evento para o usuário no namespace 'queue'
    this.websocketEmitter.send(
      userId,           // ID do usuário
      'queue',          // Namespace
      'matchFound',     // Evento
      { matchId }       // Payload
    )
  }
}
```

### Tipagem

O serviço é totalmente tipado usando o `NamespacesMap`:

```typescript
// shared/websocket/namespaces-map.ts
export type NamespacesMap = {
  match: GameServerEventsMap
  queue: QueueServerEventsMap
  '': DefaultEventsMap
}
```

Isso garante que você só pode emitir eventos válidos para cada namespace:

```typescript
// ✅ Correto - 'matchFound' existe em QueueServerEventsMap
this.websocketEmitter.send(userId, 'queue', 'matchFound', { matchId })

// ❌ Erro de TypeScript - 'invalidEvent' não existe
this.websocketEmitter.send(userId, 'queue', 'invalidEvent', {})
```

---

## GatewayEvent Decorator

O decorator `@GatewayEvent` (`common/decorators/gateway-event.decorator.ts`) simplifica o uso do `@OnEvent` em gateways.

### Problema

Ao usar `@OnEvent` dentro de um gateway, você precisa prefixar manualmente o namespace:

```typescript
@OnEvent('queue.userMatched')  // Precisa lembrar o prefixo
handleUserMatched() { ... }
```

### Solução

O `@GatewayEvent` lê o namespace automaticamente do decorator `@WebSocketGateway`:

```typescript
@WebSocketGateway({ namespace: 'queue' })
export class QueueGateway extends BaseGateway {

  @GatewayEvent('userMatched')  // Automaticamente vira 'queue.userMatched'
  handleUserMatched(event: UserMatchedEvent) {
    this.send(event.userId, 'matchFound', { matchId: event.matchId })
  }
}
```

### Implementação

```typescript
export const GatewayEvent = (eventName: string): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    // Lê o namespace do metadata do @WebSocketGateway
    const namespace = Reflect.getMetadata(NAMESPACE_METADATA, target.constructor)

    // Combina namespace + evento
    const fullEventName = `${namespace}.${eventName}`

    // Aplica @OnEvent com o nome completo
    OnEvent(fullEventName)(target, propertyKey, descriptor)

    return descriptor
  }
}
```

---

## Eventos

### Cliente → Servidor

| Namespace | Evento | Payload | Descrição |
|-----------|--------|---------|-----------|
| `/queue` | `casual` | - | Entrar na fila casual |
| `/queue` | `ranked` | - | Entrar na fila ranqueada |
| `/queue` | `dequeue` | `mode` | Sair da fila |
| `/queue` | `bot-0`...`bot-3` | - | Jogar contra bot |
| `/match` | `pick` | `choice: 1-9` | Fazer escolha |
| `/match` | `surrender` | - | Desistir |
| `/match` | `message` | `string` | Enviar mensagem |
| `/match` | `getState` | - | Solicitar estado atual |
| `/match` | `getAssignments` | - | Solicitar dados dos jogadores |

### Servidor → Cliente

| Namespace | Evento | Payload | Descrição |
|-----------|--------|---------|-----------|
| `/queue` | `userCount` | `{ casual, ranked, connected }` | Contagem de usuários |
| `/queue` | `matchFound` | `{ matchId }` | Match encontrado |
| `/match` | `stateReport` | `MatchState` | Estado atual da partida |
| `/match` | `assignments` | `PlayerAssignments` | Dados dos jogadores |
| `/match` | `message` | `MessagePayload` | Mensagem recebida |
| `/match` | `sync` | `SyncPayload` | Sincronização de estado |
| `/match` | `end` | `EndPayload` | Partida terminou |

---

## CORS

Todos os gateways são configurados com CORS restrito usando uma constante centralizada:

**Arquivo de configuração:**

```typescript
// backend/src/shared/constants/cors.ts
export const CORS_ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',
]
```

**Uso nos gateways:**

```typescript
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'

@WebSocketGateway({
  cors: {
    origin: CORS_ALLOWED_ORIGINS,
    credentials: true
  },
  namespace: 'match'
})
export class MatchGateway extends BaseGateway { ... }
```

**Benefícios:**
- ✅ Configuração centralizada em um único lugar
- ✅ Fácil de manter e atualizar
- ✅ Consistência entre HTTP e WebSocket
- ✅ Reduz duplicação de código

---

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `common/websocket/base.gateway.ts` | Classe base para gateways |
| `common/guards/ws-throttler.guard.ts` | Guard de rate limiting |
| `common/decorators/gateway-event.decorator.ts` | Decorator para eventos |
| `common/filters/throttling.filter.ts` | Filter para exceções de throttling |
| `infra/websocket/websocket.module.ts` | Módulo de WebSocket |
| `infra/websocket/websocket-emitter.service.ts` | Serviço de emissão |
| `infra/websocket/types.ts` | Tipos do módulo |
| `shared/websocket/namespaces-map.ts` | Mapa de namespaces e tipos |
| `modules/match/match.gateway.ts` | Gateway de partidas |
| `modules/queue/queue.gateway.ts` | Gateway da fila |
| `app.gateway.ts` | Gateway principal |
