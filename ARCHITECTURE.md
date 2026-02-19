# Arquitetura do Magic3T

Este documento descreve a arquitetura técnica do projeto Magic3T, um jogo multiplayer em tempo real com sistema de rating/ranking.

## Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, Radix UI |
| **Backend** | NestJS, TypeScript, WebSockets (Socket.IO) |
| **Database** | Firebase Firestore |
| **Autenticação** | Firebase Authentication (Google Provider) |
| **Observabilidade** | Sentry (Error tracking, Performance monitoring) - Backend e Frontend |
| **Monorepo** | npm Workspaces |
| **Linting** | Biome |
| **Deploy** | Render (backend), Vercel (frontend) |

---

## Estrutura de Pastas

```
Magic3T/
├── backend/                 # API NestJS
├── frontend/                # App React/Vite
├── packages/                # Bibliotecas compartilhadas
│   ├── api-types/           # Tipos de API (DTOs, eventos WebSocket)
│   ├── common-types/        # Tipos comuns (Team, Choice, Rating)
│   └── database-types/      # Tipos de entidades do banco (UserRow, MatchRow)
├── biome.json               # Configuração do linter
├── package.json             # Workspaces do monorepo
└── render.yaml              # Configuração de deploy
```

---

## Backend (`backend/`)

### Estrutura de Módulos

```
backend/src/
├── instrument.ts            # ⚡ Instrumentação (Sentry) - DEVE ser importado primeiro
├── main.ts                  # Bootstrap da aplicação
├── app.module.ts            # Módulo raiz - importa todos os outros
├── app.gateway.ts           # WebSocket gateway principal
├── app.controller.ts        # Controller de health check
│
├── infra/                   # 🏗️ Infraestrutura (external services)
│   ├── firestore/           # 💾 Camada de dados (Firestore)
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── repositories/    # Repositories por entidade
│   │       ├── base-repository.ts
│   │       ├── user/
│   │       ├── match/
│   │       ├── config/
│   │       └── crash-report/
│   │
│   ├── firebase/            # 🔥 Integração Firebase
│   │   ├── firebase.module.ts
│   │   └── firebase.service.ts
│   │
│   └── websocket/           # 🔌 Infraestrutura WebSocket
│       ├── websocket.module.ts
│       ├── websocket-emitter.service.ts
│       └── types.ts
│
├── modules/                 # 📦 Módulos de Negócio
│   ├── auth/                # 🔐 Autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── auth-request.ts
│   │   ├── auth-socket.ts
│   │   ├── skip-auth.decorator.ts
│   │   └── user-id.decorator.ts
│   │
│   ├── match/               # 🎮 Lógica de Partidas
│   │   ├── match.module.ts
│   │   ├── match.service.ts
│   │   ├── match.controller.ts
│   │   ├── match.gateway.ts
│   │   ├── match.guard.ts
│   │   ├── client-sync.service.ts
│   │   ├── persistance.service.ts
│   │   ├── lib/             # Lógica do jogo (Match, MatchBank)
│   │   ├── bots/            # Implementações de bots
│   │   └── events/          # Eventos internos
│   │
│   ├── queue/               # ⏳ Fila de Matchmaking
│   │   ├── queue.module.ts
│   │   ├── queue.service.ts
│   │   ├── queue.controller.ts
│   │   └── queue.gateway.ts
│   │
│   ├── rating/              # ⭐ Sistema de Rating/ELO
│   │   ├── rating.module.ts
│   │   ├── rating.service.ts
│   │   └── rating-converter.ts
│   │
│   ├── user/                # 👤 Usuários
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   └── user.controller.ts
│   │
│   └── admin/               # 🛡️ Administração
│       ├── admin.module.ts
│       ├── admin.guard.ts
│       └── admin.service.ts
│
├── common/                  # 🔧 Utilitários Compartilhados
│   ├── decorators/          # Decorators customizados
│   │   └── gateway-event.decorator.ts
│   ├── errors/              # Classes de erro
│   ├── filters/             # Exception filters
│   │   ├── response-error.filter.ts
│   │   ├── unexpected-error.filter.ts
│   │   └── throttling.filter.ts
│   ├── guards/              # Guards compartilhados
│   │   └── ws-throttler.guard.ts
│   ├── pipes/               # Validation pipes
│   ├── websocket/           # Classes base WebSocket
│   │   └── base.gateway.ts
│   └── utils/               # Funções utilitárias
│
└── shared/                  # 📦 Tipos Internos Compartilhados
    ├── types/               # Tipos utilitários
    └── websocket/           # Tipos WebSocket
        └── namespaces-map.ts
```

### Dependências entre Módulos

```
                         ┌─────────────────┐
                         │   AppModule     │
                         └────────┬────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
┌─────────────────┐       ┌─────────────────┐         ┌─────────────────┐
│     infra/      │       │    modules/     │         │    common/      │
│  (Firebase,     │◄──────│  (Auth, Match,  │────────►│  (BaseGateway,  │
│   Database,     │       │   Queue, User,  │         │   Guards,       │
│   WebSocket)    │       │   Rating, Admin)│         │   Filters)      │
└─────────────────┘       └─────────────────┘         └─────────────────┘

                    Fluxo detalhado dos módulos:

         ┌─────────┐        ┌──────────┐        ┌──────────┐
         │  Auth   │◄───────│ Firebase │◄───────│ Firestore│
         └─────────┘        └──────────┘        └──────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
                   ▼              ▼              ▼
              ┌─────────┐   ┌──────────┐   ┌─────────┐
              │  Match  │◄──│  Queue   │   │  User   │
              └─────────┘   └──────────┘   └─────────┘
                   │              │
                   ▼              │
              ┌─────────┐        │
              │ Rating  │◄───────┘
              └─────────┘
                   │
                   ▼
         ┌────────────────┐
         │ WebsocketModule│ (emite eventos para gateways)
         └────────────────┘
```

---

## Frontend (`frontend/`)

### Estrutura

```
frontend/src/
├── main.tsx                 # Entry point
├── main.css                 # Estilos globais (Tailwind)
├── route-tree.gen.ts        # Rotas geradas automaticamente
│
├── routes/                  # 📍 Páginas (TanStack Router)
│   ├── __root.tsx           # Layout raiz
│   ├── index.tsx            # Home
│   ├── game.$matchId.tsx    # Tela de partida
│   ├── profile.$slug.tsx    # Perfil de usuário
│   └── ...
│
├── components/              # 🧱 Componentes React
│   ├── atoms/               # Componentes básicos (Button, Input)
│   └── ...                  # Componentes compostos
│
├── contexts/                # 🌐 Contextos React
│   ├── auth-context.tsx     # Estado de autenticação
│   ├── game-context.tsx     # Estado da partida atual
│   ├── queue.context.tsx    # Estado da fila
│   └── ...
│
├── services/                # 🔌 Comunicação com Backend
│   ├── firebase.ts          # Inicialização Firebase Client
│   └── clients/
│       ├── api-client.ts    # Clientes REST (UserApiClient, MatchApiClient)
│       └── base-api-client.ts # Cliente base com auth headers
│
├── hooks/                   # 🪝 Custom Hooks
├── lib/                     # 📚 Utilitários
├── types/                   # 📦 Tipos do frontend
└── assets/                  # 🖼️ Imagens, fontes
```

---

## Packages Compartilhados (`packages/`)

### `@magic3t/api-types`
Tipos compartilhados entre frontend e backend:
- **DTOs** de controllers (requests/responses)
- **Eventos WebSocket** (QueueServerEvents, MatchServerEvents)
- **Tipos de erro**

### `@magic3t/common-types`
Tipos de domínio do jogo:
- `Team` - Order/Chaos
- `Choice` - Escolhas do jogo (1-9)
- `Rating` - Estrutura de rating

### `@magic3t/database-types`
Tipos de entidades do Firestore:
- `UserRow` - Documento de usuário
- `MatchRow` - Documento de partida
- `BotConfig` - Configuração de bots

---

## Fluxo de Autenticação

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DE AUTENTICAÇÃO                           │
└──────────────────────────────────────────────────────────────────────────┘

1. LOGIN (Frontend → Firebase)
   ┌──────────┐      signInWithPopup()       ┌──────────────┐
   │ Frontend │ ────────────────────────────►│ Firebase Auth│
   │  (React) │◄──────────────────────────── │   (Google)   │
   └──────────┘      ID Token + User Info    └──────────────┘

2. CHAMADA AUTENTICADA (Frontend → Backend)
   ┌──────────┐   Authorization: Bearer <token>   ┌──────────┐
   │ Frontend │ ─────────────────────────────────►│ Backend  │
   │          │                                   │ (NestJS) │
   └──────────┘                                   └────┬─────┘
                                                       │
3. VALIDAÇÃO DO TOKEN (Backend → Firebase Admin)       │
                                                       ▼
   ┌──────────┐      verifyIdToken(token)       ┌──────────────┐
   │ Backend  │ ───────────────────────────────►│ Firebase Auth│
   │ AuthGuard│◄─────────────────────────────── │    Admin     │
   └──────────┘      { uid: "user123" }         └──────────────┘

4. ACESSO AUTORIZADO
   ┌──────────┐         Resposta                ┌──────────┐
   │ Frontend │◄───────────────────────────────│ Backend  │
   └──────────┘                                 └──────────┘
```

### Componentes Envolvidos

| Componente | Responsabilidade |
|------------|------------------|
| `frontend/services/firebase.ts` | Inicializa Firebase Client SDK |
| `frontend/lib/auth-client.ts` | Gerencia sessão, obtém tokens |
| `frontend/contexts/auth-context.tsx` | Estado de auth no React |
| `frontend/services/clients/base-api-client.ts` | Injeta token em requests |
| `backend/src/modules/auth/auth.guard.ts` | Intercepta requests, valida token |
| `backend/src/modules/auth/auth.service.ts` | Chama Firebase Admin para validar |
| `backend/src/infra/firebase/firebase.service.ts` | Conexão com Firebase Admin |

### Headers de Autenticação

```typescript
// HTTP Requests
headers: { Authorization: `Bearer ${idToken}` }

// WebSocket Connections
socket.handshake.auth = { token: idToken }
```

---

## Fluxo de Dados Principal

### 1. Matchmaking (Fila → Partida)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE MATCHMAKING                           │
└──────────────────────────────────────────────────────────────────────────┘

Player A                    Backend                    Player B
    │                          │                          │
    │──── WS: join queue ─────►│                          │
    │                          │◄──── WS: join queue ─────│
    │                          │                          │
    │                    ┌─────┴─────┐                    │
    │                    │QueueService│                   │
    │                    │ encontra   │                   │
    │                    │   match    │                   │
    │                    └─────┬─────┘                    │
    │                          │                          │
    │                    ┌─────┴─────┐                    │
    │                    │MatchService│                   │
    │                    │ cria match │                   │
    │                    └─────┬─────┘                    │
    │                          │                          │
    │◄── WS: match.found ──────┼────── WS: match.found ──►│
    │                          │                          │
```

### 2. Durante a Partida

```
Player A                    Backend                    Player B
    │                          │                          │
    │──── WS: match.move ─────►│                          │
    │                          │                          │
    │                    ┌─────┴─────┐                    │
    │                    │   Match   │                    │
    │                    │  (lib)    │                    │
    │                    │ processa  │                    │
    │                    └─────┬─────┘                    │
    │                          │                          │
    │◄── WS: match.sync ───────┼────── WS: match.sync ───►│
    │                          │                          │
    │                    [Partida termina]                │
    │                          │                          │
    │                    ┌─────┴─────┐                    │
    │                    │Persistance │                   │
    │                    │  Service   │                   │
    │                    │ salva match│                   │
    │                    └─────┬─────┘                    │
    │                          │                          │
    │                    ┌─────┴─────┐                    │
    │                    │  Rating   │                    │
    │                    │ Service   │                    │
    │                    │atualiza ELO│                   │
    │                    └─────┬─────┘                    │
    │                          │                          │
    │◄── WS: match.end ────────┼────── WS: match.end ────►│
```

---

## Comunicação em Tempo Real (WebSockets)

### Gateways

| Gateway | Namespace | Responsabilidade |
|---------|-----------|------------------|
| `AppGateway` | `/` | Conexão geral, heartbeat |
| `QueueGateway` | `/queue` | Fila de matchmaking |
| `MatchGateway` | `/match` | Partidas em tempo real |

### Eventos Principais

#### Queue Events
```typescript
// Cliente → Servidor
'queue.join'    // Entrar na fila
'queue.leave'   // Sair da fila

// Servidor → Cliente
'queue.accepted'    // Fila aceita
'queue.matchFound'  // Match encontrado
```

#### Match Events
```typescript
// Cliente → Servidor
'match.move'     // Fazer uma jogada
'match.forfeit'  // Desistir

// Servidor → Cliente
'match.sync'     // Sincronizar estado
'match.end'      // Partida terminou
```

---

## Database (Firestore)

### Collections

```
firestore/
├── users/                   # Usuários
│   └── {userId}/
│       ├── identification   # Nickname, slug
│       ├── elo              # Rating atual
│       ├── stats            # Estatísticas
│       └── role             # user | admin | bot
│
├── matches/                 # Histórico de partidas
│   └── {matchId}/
│       ├── players          # IDs dos jogadores
│       ├── result           # Resultado
│       ├── moves            # Histórico de jogadas
│       └── timestamp        # Data/hora
│
├── config/                  # Configurações globais
│   ├── rating               # Configuração do sistema de rating
│   └── bots/                # Configurações de bots
│
└── crash-reports/           # Relatórios de erro
```

---

## Sistema de Rating

O sistema usa **ELO modificado** com Leagues:

```
ELO → RatingConverter → { league, division, lp, tier }
```

### Ligas (do menor para maior)
1. Bronze
2. Silver
3. Gold
4. Platinum
5. Diamond
6. Master
7. Challenger (top players)

### Fluxo de Atualização

```
Partida termina
       │
       ▼
MatchFinishedEvent
       │
       ▼
RatingService.updateRating()
       │
       ▼
UserRepository.updateElo()
```

---

## Scripts Importantes

```bash
# Raiz do monorepo
npm install          # Instala deps de todos os workspaces
npm run lint         # Roda Biome em todo o projeto

# Backend
cd backend
npm run start:dev    # Dev server com hot reload
npm run build        # Build de produção
npm run test         # Testes com Vitest

# Frontend
cd frontend
npm run dev          # Dev server Vite
npm run build        # Build de produção
```

---

## Variáveis de Ambiente

### Backend (`.env`)
```env
FIREBASE_ADMIN_CREDENTIALS=<base64 do JSON de credenciais>
FIRESTORE_DB=<nome do database>
PORT=3000
```

### Frontend (`.env`)
```env
# URL do backend
VITE_API_URL=http://localhost:4000

# URL do CDN para assets
VITE_CDN_URL=https://storage.googleapis.com/your-bucket.appspot.com

# Firebase Credentials
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

> ⚠️ **Importante:** Nunca commite credenciais reais. Use o arquivo `.env.example` como template.

---

## Segurança

O projeto implementa múltiplas camadas de segurança tanto para requisições HTTP quanto WebSocket.

### Headers de Segurança (Helmet)

O backend utiliza o middleware [Helmet](https://helmetjs.github.io/) para configurar headers HTTP de segurança:

```typescript
// main.ts
import helmet from 'helmet'
app.use(helmet())
```

Headers configurados automaticamente:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`

### CORS (Cross-Origin Resource Sharing)

O CORS está configurado para aceitar apenas origens autorizadas, centralizadas em um arquivo de configuração:

**Arquivo de configuração:**

```typescript
// backend/src/shared/constants/cors.ts
export const CORS_ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',  // Desenvolvimento
]
```

**Uso em HTTP requests:**

```typescript
// backend/src/main.ts
import { CORS_ALLOWED_ORIGINS } from './shared/constants/cors'

app.enableCors({
  origin: CORS_ALLOWED_ORIGINS,
  credentials: true,
})
```

**Uso em WebSocket Gateways:**

```typescript
// backend/src/modules/match/match.gateway.ts
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'

@WebSocketGateway({
  cors: { origin: CORS_ALLOWED_ORIGINS, credentials: true },
  namespace: 'match'
})
export class MatchGateway extends BaseGateway { ... }
```

Todos os gateways (`AppGateway`, `QueueGateway`, `MatchGateway`) importam esta mesma constante, garantindo consistência e facilitando manutenção.

### Rate Limiting

#### HTTP (ThrottlerModule)

O NestJS ThrottlerModule limita requisições HTTP:

```typescript
ThrottlerModule.forRoot({
  throttlers: [
    { name: 'short', limit: 3, ttl: 1000 },   // 3 req/segundo
    { name: 'medium', limit: 20, ttl: 10000 }, // 20 req/10 segundos
    { name: 'long', limit: 100, ttl: 60000 },  // 100 req/minuto
  ]
})
```

#### WebSocket (WsThrottlerGuard)

Um guard customizado protege os WebSocket gateways contra abuso:

```typescript
// common/guards/ws-throttler.guard.ts
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    // Identifica cliente pelo IP
    const tracker = client.handshake.address
    // Incrementa contador e verifica limite
    // Bloqueia se exceder limite
  }
}
```

### Validação de Entrada

#### ValidationPipe Global

Todas as requisições passam por validação automática:

```typescript
app.useGlobalPipes(new ValidationPipe())
```

#### DTOs com class-validator

```typescript
export class ChangeNickCommandClass {
  @IsDefined()
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  @Matches(/^[a-zA-Z0-9áÁâÂ...]*$/)
  nickname: string
}
```

#### Sanitização de Mensagens de Chat

Mensagens de chat são validadas e sanitizadas:

```typescript
const MAX_MESSAGE_LENGTH = 500

// Valida tipo e tamanho
if (!body || typeof body !== 'string' || body.length > MAX_MESSAGE_LENGTH) {
  return
}

// Sanitiza conteúdo
const sanitizedMessage = body.trim().slice(0, MAX_MESSAGE_LENGTH)
```

### Exception Filters

Filters globais garantem tratamento consistente de erros:

| Filter | Propósito |
|--------|----------|
| `UnexpectedErrorFilter` | Captura erros não tratados, retorna 500 genérico |
| `ResponseErrorFilter` | Formata erros esperados com `errorCode` |
| `ThrottlingFilter` | Trata exceção de rate limit |

### Autenticação WebSocket

A autenticação WebSocket é feita durante a conexão:

```typescript
// BaseGateway.handleConnection()
async handleConnection(client: Socket) {
  const token = client.handshake.auth.token
  const userId = await this.authService.validateToken(token)

  if (!userId) {
    client.send('error', { errorCode: 'unauthorized' })
    client.disconnect()
    return
  }

  client.data.userId = userId
  client.join(`user:${userId}@${this.namespace}`)
}
```

### Boas Práticas Implementadas

| Prática | Status | Detalhes |
|---------|--------|----------|
| Credenciais em variáveis de ambiente | ✅ | Firebase config via `import.meta.env` |
| CORS restrito | ✅ | Apenas domínios autorizados |
| Rate limiting HTTP | ✅ | ThrottlerModule configurado |
| Rate limiting WebSocket | ✅ | WsThrottlerGuard customizado |
| Headers de segurança | ✅ | Helmet middleware |
| Validação de entrada | ✅ | ValidationPipe + class-validator |
| Container não-root | ✅ | `USER node` no Dockerfile |
| Sanitização de mensagens | ✅ | Limite de tamanho e trim |

---

## Padrões e Convenções

### Naming
- **Arquivos**: `kebab-case.ts`
- **Classes/Types**: `PascalCase`
- **Funções/variáveis**: `camelCase`
- **Eventos WebSocket**: `namespace.action` (ex: `match.move`)

### Estrutura de Módulos NestJS
Cada módulo segue a estrutura:
```
module-name/
├── module-name.module.ts    # Definição do módulo
├── module-name.service.ts   # Lógica de negócio
├── module-name.controller.ts # Endpoints REST
├── module-name.gateway.ts   # WebSocket (se aplicável)
├── dtos/                    # Data Transfer Objects
├── types/                   # Tipos internos
└── index.ts                 # Exports públicos
```

### Exports
Cada pasta com `index.ts` exporta sua API pública:
```typescript
// firestore/index.ts
export * from './database.module'
export * from './database.service'
export * from './user'
export * from './match'
```

### Constantes Compartilhadas

Constantes que são usadas em múltiplos lugares devem ser centralizadas em `backend/src/shared/constants/`:

| Arquivo | Uso |
|---------|-----|
| `cors.ts` | Origens CORS permitidas - importada em `main.ts` e todos os gateways |

**Exemplo:**
```typescript
// backend/src/shared/constants/cors.ts
export const CORS_ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',
]

// Uso em qualquer lugar
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'
```
