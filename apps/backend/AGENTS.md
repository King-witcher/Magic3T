# Backend Agent Instructions

NestJS backend for Magic3T — a real-time competitive logic game (magic square / tic-tac-toe variant). REST + WebSocket, PostgreSQL + Firestore, Firebase auth.

## Docs to Read First

- [Architecture overview](../../ARCHITECTURE.md)
- [Database schema & conventions](docs/DATABASE.md)
- [Error-handling patterns](docs/ERROR-HANDLING.md)
- [WebSocket architecture](docs/WEBSOCKETS.md)

## Build & Test

```bash
# From apps/backend/
npm run dev          # Watch mode (hot reload)
npm run build        # Production build + Sentry source maps
npm run test         # Vitest
npm run typecheck    # tsc --noEmit
npm run lint         # Biome — set to error on warnings
```

Tests use **Vitest** with globals (`describe`/`it`/`test`) — no explicit import needed. Path alias `@/` resolves to `src/`.

## Module & Dependency Rules

- `InfrastructureModule` and `AuthModule` are `@Global()` — **never** re-import them inside other modules.
- Services provided by other modules must be listed in that module's `exports: [...]`; forgetting this causes runtime DI errors.
- New business modules go under `src/modules/`; infra integrations go under `src/infra/`.

## Error Handling

Use helpers from `@/common` — never throw plain `Error` for expected failures:

```typescript
import { respondError, unexpected } from '@/common'

// Expected failure visible to the client
respondError('user-not-found', 404)
respondError('not-authorized', 403, { reason: '...' })

// Programmer error / invariant violation — client sees generic 500
unexpected('Bot config missing', { botId })
```

HTTP response shape: `{ errorCode: string, metadata?: unknown }`.
WebSocket errors emit the `error` event with the same shape.
`UnexpectedErrorFilter` captures unexpected errors to Sentry automatically.

See [docs/ERROR-HANDLING.md](docs/ERROR-HANDLING.md) for the complete filter chain.

## Authentication & Guards

Two auth flows operate identically:

| Context | Mechanism |
|---------|-----------|
| HTTP | `AuthMiddleware` validates Firebase token → creates `session:{id}` in cache |
| WebSocket | `BaseGateway.handleConnection()` validates session ID from `socket.handshake.auth.token` |

- `@UseGuards(AuthGuard)` protects routes/gateways (reads `request.session` or `socket.data.session`).
- `@SkipAuth()` marks a route/gateway class as public.
- `@UserId()` / `@Session()` are parameter decorators that work in both HTTP and WS contexts.
- `AdminGuard` requires role `'admin'` or `'superuser'`.

Guards and filters must handle **both HTTP and WS contexts** via `context.getType()`.

## WebSocket Conventions

Three namespaces: `/` (heartbeat), `/queue` (matchmaking), `/match` (gameplay).

All gateways extend `BaseGateway`, which handles:
- Auto-auth on connection
- Joining `user:{userId}@{namespace}` room
- Cross-service event routing via `@OnEvent('websocket.emit')`

To emit from a non-gateway service:

```typescript
constructor(private wsEmitter: WebsocketEmitterService) {}

this.wsEmitter.send(userId, 'match', MatchServerEvents.StateReport, state)
this.wsEmitter.send(null, 'queue', QueueServerEvents.UserCount, count)  // broadcast
```

Distinguish decorators:
- `@SubscribeMessage('x')` — listens for messages from the client.
- `@OnEvent('x')` — listens for internal NestJS EventEmitter2 events.

## Database

Two storage layers — never mix their patterns:

| Layer | Technology | Access |
|-------|-----------|--------|
| Relational | PostgreSQL via `pg` Pool | `DatabaseService.query<T>(sql, params)` / `db.transaction(fn)` |
| Document | Firestore | Repository classes extending `BaseFirestoreRepository` |

**SQL safety:** Use `PgChain` (`src/shared/database/pg-chain.ts`) for parameterized queries — never concatenate SQL strings. Inside a transaction, use the `client` argument directly, not the `DatabaseService`.

**Type definitions:** Row shapes live in `@magic3t/database-types` (`packages/database-types/`). Always use the correct row/document type rather than `any`.

## Shared API Types

`@magic3t/api-types` (`packages/api-types/`) defines HTTP response types and WebSocket event maps shared between backend and frontend. Update these types when adding new endpoints or WS events so the frontend stays in sync.

## Sentry

`src/instrument.ts` **must be the very first import** in `main.ts`. Moving it breaks error tracking. Do not remove or reorder that import.

## Conventions Checklist

- DTOs and pipes validate at the boundary; inside services assume data is valid.
- Prefer `respondError` over `throw new HttpException(...)` for expected failures.
- Rate-limiting (`WsThrottlerGuard`) is global for WebSocket — don't add a second throttler.
- Nickname changes have a 30-day cooldown enforced in `UserService` — don't duplicate the check.
- Session TTL is `ONE_WEEK` (set once on creation, not refreshed on use).
