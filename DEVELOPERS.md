# Guia do Desenvolvedor — Magic3T

Guia completo para desenvolvedores e agentes de IA trabalhando no projeto Magic3T. Aqui você encontra tudo o que precisa saber para configurar, entender, modificar e contribuir com o projeto.

---

## Sumário

- [Visão Geral do Projeto](#visão-geral-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Setup do Ambiente](#setup-do-ambiente)
- [Estrutura do Monorepo](#estrutura-do-monorepo)
- [Packages Compartilhados](#packages-compartilhados)
- [Backend](#backend)
- [Frontend](#frontend)
- [Migrations (PostgreSQL)](#migrations-postgresql)
- [Linting e Formatação](#linting-e-formatação)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Deploy](#deploy)
- [VS Code — Tasks, Launch e Settings](#vs-code--tasks-launch-e-settings)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Convenções e Padrões](#convenções-e-padrões)
- [Segurança](#segurança)
- [Links para Documentações Detalhadas](#links-para-documentações-detalhadas)

---

## Visão Geral do Projeto

Magic3T é um jogo multiplayer em tempo real baseado no conceito de quadrado mágico, com sistema de rating/ranking (ELO), matchmaking, bots com IA minimax e interface web rica.

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19 (com React Compiler), TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS 4, Radix UI |
| **Backend** | NestJS, TypeScript, Socket.IO (WebSockets) |
| **Databases** | Firebase Firestore + PostgreSQL (via `pg`) |
| **Autenticação** | Firebase Authentication (Google + Email/Password) |
| **Observabilidade** | Sentry (error tracking, performance, session replay) |
| **Analytics** | Vercel Analytics + Speed Insights |
| **Monorepo** | npm Workspaces |
| **Linting** | Biome |
| **Deploy** | Render (backend) + Vercel (frontend) |
| **CI/CD** | GitHub Actions (Biome CI, Reviewdog, Migrations) |

---

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| **Node.js** | 24.x (definido em `.node-version`: `24.13.0`) |
| **npm** | 10+ (vem com o Node 24) |
| **Docker** | Para PostgreSQL local (opcional) |
| **VS Code** | Recomendado, com extensão Biome (`biomejs.biome`) |

---

## Setup do Ambiente

### 1. Instalar dependências

```bash
npm install
```

Isso instala as dependências de **todos os workspaces** (backend, frontend, packages).

### 2. Configurar variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Migrations (para rodar localmente)
cp packages/migrations/.env.example packages/migrations/.env
```

Preencha os valores necessários em cada `.env`. Veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente) para detalhes.

### 3. Subir o PostgreSQL local

```bash
docker compose up -d
```

Isso inicia um container PostgreSQL com:
- **Usuário:** `dev`
- **Senha:** `let-me-in`
- **Banco:** `magic3t`
- **Porta:** `5432`

### 4. Aplicar migrações

```bash
npm run migrate
```

### 5. Iniciar os servidores de desenvolvimento

```bash
# Backend (porta 4000)
cd backend && npm run dev

# Frontend (porta 3000)
cd frontend && npm run dev
```

Ou use as launch configurations do VS Code (veja abaixo).

---

## Estrutura do Monorepo

```
Magic3T/
├── .github/workflows/       # GitHub Actions (CI/CD)
│   ├── biome.yml            # Lint check em PRs e pushes
│   ├── reviewdog.yml        # Code review automático em PRs
│   └── migrations.yml       # Aplica migrations em produção
├── .vscode/                 # Configurações do VS Code
│   ├── launch.json          # Debug configurations
│   ├── settings.json        # Editor settings
│   └── tasks.json           # Tasks automatizadas
├── backend/                 # API NestJS
├── frontend/                # App React/Vite
├── packages/                # Bibliotecas compartilhadas
│   ├── api-types/           # Tipos de API (DTOs, eventos WebSocket)
│   ├── common-types/        # Tipos de domínio (Team, Choice, Rating)
│   ├── database-types/      # Tipos de entidades do banco (UserRow, MatchRow)
│   └── migrations/          # Migrações SQL do PostgreSQL
├── biome.json               # Configuração do linter (global)
├── compose.yaml             # Docker Compose (PostgreSQL local)
├── package.json             # Workspaces e scripts do monorepo
├── render.yaml              # Deploy IaC (Render)
└── .node-version            # Versão do Node.js (24.13.0)
```

### npm Workspaces

O `package.json` raiz define os workspaces:

```json
{
  "workspaces": [
    "backend",
    "frontend",
    "packages/api-types",
    "packages/common-types",
    "packages/database-types",
    "packages/migrations"
  ]
}
```

**Comandos úteis com workspaces:**

```bash
# Executar script em um workspace específico
npm run <script> --workspace=backend
npm run <script> -w packages/migrations

# Instalar dependência em um workspace
npm install <pacote> --workspace=frontend

# Instalar dependências de um workspace isolado (e raiz)
npm ci --workspace=backend --include-workspace-root
```

---

## Packages Compartilhados

Os pacotes em `packages/` são importados como dependências internas (`"@magic3t/api-types": "*"` no `package.json` do consumer). Todos exportam TypeScript puro via `src/index.ts` — sem build step.

### `@magic3t/api-types`

Tipos compartilhados de API — usados tanto no backend quanto no frontend:

- **DTOs** de controllers (requests/responses)
- **Eventos WebSocket** (Client→Server e Server→Client)
- **Tipos de erro**
- Depende de `@magic3t/database-types`

### `@magic3t/common-types`

Tipos de domínio do jogo:

| Tipo | Descrição |
|------|-----------|
| `Team` | `Order` (0) / `Chaos` (1) |
| `Choice` | Escolhas do jogo (1-9) |
| `Rating` | Estrutura de rating/ELO |

### `@magic3t/database-types`

Tipos das entidades persistidas no Firestore:

- `UserRow` — Documento de usuário
- `MatchRow` — Documento de partida
- `BotConfigRow` — Configuração de bots
- `RatingConfigRow` — Configuração do sistema de rating
- `CrashReportRow` — Relatórios de erro

### `@magic3t/migrations`

Sistema de migrações SQL. Veja a seção [Migrations](#migrations-postgresql).

---

## Backend

### Stack

| Tecnologia | Uso |
|------------|-----|
| NestJS 11 | Framework backend |
| Socket.IO 4 | WebSockets em tempo real |
| Firebase Admin 13 | Autenticação e Firestore |
| `pg` (via `DatabaseService`) | PostgreSQL (raw queries) |
| Zod + class-validator | Validação |
| Swagger + Scalar | Documentação de API |
| Sentry | Error tracking e logs |
| Vitest | Testes |

### Estrutura

```
backend/src/
├── instrument.ts            # Sentry (DEVE ser o primeiro import)
├── main.ts                  # Bootstrap (NestFactory, Helmet, CORS, Swagger)
├── app.module.ts            # Módulo raiz
├── app.gateway.ts           # WebSocket gateway raiz (namespace /)
├── app.controller.ts        # Health check, crash reports
├── index.d.ts               # Tipos globais (ProcessEnv, Ok/Err/panic)
│
├── infra/                   # Infraestrutura (serviços externos)
│   ├── infrastructure.module.ts  # @Global module que exporta todos abaixo
│   ├── database/            # PostgreSQL (DatabaseService: pool, query, transaction)
│   ├── firebase/            # Firebase Admin SDK
│   ├── firestore/           # Firestore repositories (users, matches, config, crash-reports)
│   └── websocket/           # WebSocket (emitter, counting service)
│
├── modules/                 # Módulos de negócio
│   ├── auth/                # Autenticação (AuthGuard, AuthService, decorators)
│   ├── match/               # Partidas (lógica do jogo, bots, persistência)
│   ├── queue/               # Fila de matchmaking
│   ├── rating/              # Sistema ELO (RatingService, RatingConverter)
│   ├── user/                # Gerenciamento de usuários
│   └── admin/               # Endpoints administrativos
│
├── common/                  # Utilitários compartilhados
│   ├── decorators/          # @GatewayEvent
│   ├── errors/              # ResponseError, UnexpectedError
│   ├── filters/             # Exception filters (ResponseError, Unexpected, Throttling)
│   ├── guards/              # WsThrottlerGuard
│   ├── pipes/               # Validation pipes
│   ├── websocket/           # BaseGateway (classe base tipada para gateways)
│   └── utils/               # Funções utilitárias
│
└── shared/
    ├── constants/           # CORS_ALLOWED_ORIGINS, etc.
    ├── types/               # Tipos internos
    └── websocket/           # NamespacesMap (tipagem de namespaces)
```

### Path Alias

O backend usa `@/` como alias para `./src/`:

```typescript
import { AuthService } from '@/modules/auth/auth.service'
```

Configurado em `tsconfig.json` (`paths`) e `vitest.config.ts` (`resolve.alias`).

### Módulo `InfrastructureModule`

É o módulo `@Global()` que agrega e exporta toda a infra:

```typescript
@Global()
@Module({
  imports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule],
  exports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule],
})
export class InfrastructureModule {}
```

Qualquer módulo de negócio pode injetar `DatabaseService`, `FirebaseService`, repositories, etc. sem importar explicitamente.

### WebSocket — `BaseGateway`

Todos os gateways (`AppGateway`, `QueueGateway`, `MatchGateway`) estendem `BaseGateway<TClient, TServer, TNamespace>`:

- Autenticação automática no `handleConnection()` (valida token Firebase)
- Rate limiting via `WsThrottlerGuard`
- Exception filters aplicados (`UnexpectedErrorFilter`, `ResponseErrorFilter`, `ThrottlingFilter`)
- Métodos `send(userId, event, ...data)` e `broadcast(event, ...data)` com type-safety
- Tipagem de namespaces via `NamespacesMap`

### Tipos Globais (backend)

O arquivo `src/index.d.ts` define:

- `Ok<T, E>()` / `Err<T, E>()` / `panic()` — Utilitários estilo Rust
- `Express.Request.session` — Tipagem de sessão
- `NodeJS.ProcessEnv` — Todas as variáveis de ambiente tipadas

### Scripts do Backend

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `nest start -wd` | Dev server com hot reload e debug |
| `build` | `nest build && sentry:sourcemaps` | Build + upload de sourcemaps para Sentry |
| `start:prod` | `node dist/main` | Inicia o build de produção |
| `test` | `vitest` | Testes com Vitest |
| `typecheck` | `tsc --noEmit` | Verificação de tipos |
| `lint` | `biome check src --error-on-warnings` | Lint com Biome |

### Documentação de API

Em desenvolvimento, acessível em:

- **Scalar API Reference:** `http://localhost:4000/api`

---

## Frontend

### Stack

| Tecnologia | Uso |
|------------|-----|
| React 19 | UI framework (com React Compiler via babel plugin) |
| Vite 7 | Build tool |
| TanStack Router | Roteamento file-based com code splitting |
| TanStack Query | Data fetching e cache |
| Tailwind CSS 4 | Estilos utilitários |
| Socket.IO Client | WebSockets |
| Radix UI | Componentes acessíveis (Dialog, Tooltip, Popover, Label) |
| Firebase Client | Autenticação |
| Jotai + Zustand | Estado local |
| Framer Motion | Animações |
| Sentry | Error tracking + Session Replay |
| Ladle | Component stories |

### Estrutura

```
frontend/src/
├── instrument.ts            # Sentry (deve ser primeiro import)
├── main.tsx                 # Entry point (createRoot, Sentry error handlers)
├── main.css                 # Estilos globais (Tailwind)
├── prelude.ts               # Injeta Ok/Err globais (estilo Rust)
├── router.ts                # Criação do TanStack Router
├── route-tree.gen.ts        # GERADO AUTOMATICAMENTE — não editar
│
├── routes/                  # Páginas (TanStack Router file-based)
│   ├── __root.tsx           # Layout raiz (Providers, Toaster, Devtools)
│   ├── _auth-guarded.tsx    # Layout guard — redireciona se não autenticado
│   ├── _auth.tsx            # Layout de login — redireciona se já autenticado
│   ├── -providers.tsx       # Componente auxiliar: providers aninhados
│   ├── -global-error.tsx    # Componente auxiliar: error boundary global
│   ├── _auth-guarded/       # Rotas protegidas (lobby, store, admin, perfil)
│   ├── _auth/               # Rotas de autenticação (sign-in, register)
│   ├── matches/             # Detalhes de partida ($match param)
│   ├── users/               # Perfil de usuário ($nickname, id/$userId)
│   ├── tutorial/            # Tutorial do jogo
│   ├── leaderboard.tsx      # Ranking
│   ├── bianca.tsx           # Página Bianca
│   └── playground/          # Playground de testes
│
├── components/              # Componentes React (Atomic Design)
│   ├── atoms/               # Spinner, TimerValue, SmoothNumber
│   ├── molecules/           # GameBoard, NumberCell
│   ├── organisms/           # Navbar, MatchDetail, ConsoleTab
│   ├── templates/           # Layouts completos (Lobby, Game, Profile, Store, etc.)
│   └── ui/                  # Primitivos de UI (Button, Dialog, Input, Panel, Tooltip, etc.)
│
├── contexts/                # React Contexts (estado global)
│   ├── auth-context.tsx     # Estado de autenticação (AuthState, AuthProvider)
│   ├── game-context.tsx     # Estado da partida atual
│   ├── queue-context.tsx    # Estado da fila de matchmaking
│   ├── live-activity.context.tsx  # Atividade ao vivo
│   ├── service-status.context.tsx # Status do servidor
│   └── modal-store.tsx      # Store de modais (Zustand)
│
├── services/                # Comunicação com backend
│   ├── firebase.ts          # Inicialização Firebase Client SDK
│   └── clients/             # API clients REST
│       ├── base-api-client.ts  # Cliente base (auth headers, error handling)
│       ├── api-client.ts       # Instância global do ApiClient
│       ├── client-error.ts     # Classes de erro (ClientError, NotFoundError, etc.)
│       └── namespaces/         # Clients por domínio
│           ├── admin-client.ts
│           ├── match-client.ts
│           ├── queue-client.ts
│           └── user-client.ts
│
├── hooks/                   # Custom hooks
│   ├── use-gateway.ts       # Conexão com WebSocket gateway
│   ├── use-listener.ts      # Listeners de eventos WebSocket
│   ├── use-observable.ts    # Subscribe em observables
│   ├── use-outside-click.ts # Detecta clique fora de elemento
│   ├── use-client-query.ts  # Wrapper para TanStack Query com ApiClient
│   ├── use-client-mutation.ts # Wrapper para mutation com ApiClient
│   ├── use-key-listener.ts  # Listener de teclas
│   ├── use-register-command.ts # Registra comandos no console
│   ├── useInfiniteScroll.ts # Scroll infinito
│   ├── useInput.ts          # Estado de input
│   └── useLocalStorage.ts   # Local storage reativo
│
├── lib/                     # Utilitários
│   ├── auth-client.ts       # Wrapper do Firebase Auth (AuthClient class)
│   ├── channel.ts           # Event channel
│   ├── commands.ts          # Sistema de comandos do console
│   ├── observable.ts        # Observable pattern
│   ├── Timer.ts             # Timer reativo
│   ├── utils.ts             # Funções utilitárias
│   └── console/             # Console in-game
│
├── types/                   # Tipos do frontend
├── utils/                   # Utilidades (inclui Result<T,E> estilo Rust)
├── styles/                  # Estilos adicionais
└── assets/                  # Fontes, texturas
```

### Path Alias

O frontend também usa `@/` como alias para `./src/`:

```typescript
import { useAuth } from '@/contexts/auth-context'
```

Configurado em `tsconfig.json` (`paths`) e `vite.config.ts` (`resolve.alias`).

### Roteamento (TanStack Router)

O roteamento é **file-based** com geração automática de route tree:

- Arquivos em `routes/` com `_` prefix são **layout routes** (não geram URL)
- Arquivos com `-` prefix são **helpers auxiliares** (não são rotas)
- `$param` indica parâmetros dinâmicos
- O arquivo `route-tree.gen.ts` é **gerado automaticamente** pelo plugin `@tanstack/router-plugin/vite` — **nunca edite manualmente**

**Fluxo de autenticação nas rotas:**

```
__root.tsx (Providers)
├── _auth-guarded.tsx → Redireciona para /sign-in se não logado
│   ├── index.tsx (Lobby — página principal)
│   ├── store.tsx
│   ├── me/route.tsx
│   └── _admin_guarded/admin.tsx
├── _auth.tsx → Redireciona para / se já logado
│   ├── sign-in.tsx
│   └── register.tsx
├── leaderboard.tsx (público)
├── users/$nickname.tsx (público)
├── matches/$match.tsx (público)
└── tutorial/route.tsx (público)
```

### Provider Nesting Order

A ordem de providers em `-providers.tsx` (de fora para dentro):

```
QueryClientProvider → LiveActivityProvider → ServiceStatusProvider → AuthProvider → GameProvider → QueueProvider
```

### Estado de Autenticação (`AuthState`)

```typescript
enum AuthState {
  LoadingSession    // Carregando sessão Firebase
  NotSignedIn       // Não autenticado
  LoadingUserData   // Autenticado, carregando dados do usuário
  SignedInUnregistered // Autenticado mas sem nickname (precisa registrar)
  SignedIn          // Totalmente autenticado com dados carregados
}
```

### Tipos Globais (frontend)

O arquivo `prelude.ts` injeta no `window` os utilitários `Ok()` e `Err()` estilo Rust:

```typescript
window.Ok = ResultOk
window.Err = ResultErr

// Uso: const result: Result<User, Error> = Ok(user)
```

### Scripts do Frontend

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `vite` | Dev server (porta 3000) |
| `build` | `vite build` | Build de produção |
| `preview` | `vite preview` | Preview do build |
| `lint` | `biome check src --error-on-warnings` | Lint com Biome |
| `stories` | `ladle serve` | Component stories (Ladle) |

---

## Migrations (PostgreSQL)

O módulo `packages/migrations` gerencia a evolução do schema do PostgreSQL. Usa SQL puro — sem ORM.

### Comandos Rápidos

```bash
# Criar nova migração
npm run new -- nome-da-migracao       # de packages/migrations
npm run new -w packages/migrations -- nome-da-migracao  # da raiz

# Aplicar migrações localmente
npm run migrate                        # da raiz ou de packages/migrations

# Aplicar em produção (via GitHub Actions — automático)
# Push para main com alterações em packages/migrations/**
```

### Como funciona

1. Cada migração é um diretório `sql/YYYY-MM-DD-DIGEST_nome/` com `up.sql` e `down.sql`
2. O runner lista as migrações, compara com a tabela `_migrations`, e aplica as pendentes
3. Todas as pendentes rodam em **uma única transação** — se uma falhar, nenhuma é aplicada
4. Em produção, o workflow `migrations.yml` aplica automaticamente no push para `main`

Documentação completa: [`packages/migrations/MIGRATIONS.md`](packages/migrations/MIGRATIONS.md)

---

## Linting e Formatação

O projeto usa **Biome** como linter e formatter único para todo o monorepo.

### Configuração (`biome.json`)

| Aspecto | Configuração |
|---------|-------------|
| **Indentação** | 2 espaços |
| **Line ending** | LF |
| **Line width** | 100 |
| **Quotes** | Single quotes (JS/TS), double quotes (JSX) |
| **Semicolons** | Apenas quando necessário |
| **Trailing commas** | ES5 |
| **Decorators** | Habilitados (`unsafeParameterDecoratorsEnabled`) |

### Regras importantes

- `noUnusedImports`: warn
- `useExhaustiveDependencies`: info
- `noUselessElse`: error
- `useImportType`: off (não força `import type`)
- `noNonNullAssertion`: off (permite `!`)
- `noConstEnum`: off (permite `const enum`)

### Executar

```bash
# Lint + fix em todo o projeto
npm run lint                 # raiz

# Lint em workspace específico
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

### VS Code Integration

O VS Code está configurado (`.vscode/settings.json`) para:
- Formatar com Biome ao salvar (`editor.formatOnSave: true`)
- Aplicar code actions do Biome ao salvar (`source.fixAll.biome`, `source.organizeImports.biome`)

---

## Testes

### Backend

```bash
cd backend && npm test
```

- **Framework:** Vitest
- **Config:** `backend/vitest.config.ts`
- **Globals:** Habilitados (`globals: true`) — `describe`, `it`, `expect` sem import
- **Mocking:** `@faker-js/faker` disponível
- **Path alias:** `@/` resolvido via `resolve.alias`

### Frontend

Testes de componentes via **Ladle** (component stories):

```bash
cd frontend && npm run stories
```

---

## CI/CD

### GitHub Actions

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| **Biome CI** (`biome.yml`) | Push em `main` + PRs | Roda `biome ci .` para verificar lint/formato |
| **Reviewdog** (`reviewdog.yml`) | PRs | Code review automático com Biome via Reviewdog |
| **Migrations** (`migrations.yml`) | Push em `main` (paths: `packages/migrations/**`) + manual | Aplica migrações SQL no banco de produção |

### Secrets Necessários (GitHub)

| Secret | Uso |
|--------|-----|
| `PG_HOST` | Host do PostgreSQL (Neon) — usado pelo workflow de migrations |
| `PG_PORT` | Porta do PostgreSQL |
| `PG_USER` | Usuário do PostgreSQL |
| `PG_DATABASE` | Nome do banco |
| `PG_PASSWORD` | Senha do PostgreSQL |
| `GITHUB_TOKEN` | Automático — usado pelo Reviewdog |

---

## Deploy

### Backend — Render

Configurado via IaC em `render.yaml`:

- **Runtime:** Node.js
- **Build:** `npm install --workspace=backend --include-workspace-root && npm run build --workspace=backend`
- **Start:** `npm run start:prod --workspace=backend`
- **Health check:** `GET /status`
- **Domínios:** `backend.magic3t.com.br`, `api.magic3t.com.br`
- **Build filter:** Só rebuilda quando `backend/**` ou `packages/**` mudam
- **Redis:** Instância Render separada

### Frontend — Vercel

Deploy automático pelo Vercel conectado ao repositório GitHub. Build com `vite build`.

### Domínios

| Serviço | URL |
|---------|-----|
| Frontend | `https://magic3t.com.br` / `https://www.magic3t.com.br` |
| Backend (API) | `https://api.magic3t.com.br` |
| Backend (alt) | `https://backend.magic3t.com.br` |

---

## VS Code — Tasks, Launch e Settings

### Launch Configurations (`.vscode/launch.json`)

| Nome | Tipo | O que faz |
|------|------|-----------|
| **Launch Backend** | `node-terminal` | Roda `npm run dev` no backend com debug |
| **Launch Frontend** | `msedge` | Abre Edge em `localhost:3000` (executa task `vite: dev` antes) |
| **Launch Stories** | `msedge` | Abre Edge em `localhost:61000` (executa task `stories` antes) |

### Tasks (`.vscode/tasks.json`)

| Task | Ícone | Tipo | Descrição |
|------|-------|------|-----------|
| **vite: dev** | ▶️ verde | Background | Inicia o dev server Vite (frontend) |
| **stories** | ▶️ verde | Background | Inicia Ladle para component stories |
| **typecheck: backend** | 👁️ ciano | Background | `tsc --watch --noEmit` para o backend (erros no Problems panel) |
| **typecheck: frontend** | 👁️ ciano | Background | `tsc --watch --noEmit` para o frontend (erros no Problems panel) |
| **Create Migration** | 🗄️ amarelo | Interactive | Solicita nome e cria nova migração SQL |
| **Run Migrations** | 🗄️ azul | One-shot | Aplica migrações pendentes no banco local |
| **build: backend** | 🔧 branco | One-shot | Build do backend |
| **build: frontend** | 🔧 branco | One-shot | Build do frontend |
| **biome lint** | 🔧 branco | One-shot | Roda lint em todo o projeto |
| **npm audit** | 🔧 branco | One-shot | Auditoria de segurança |
| **build** | — | Composto | Roda build:backend + build:frontend + lint + audit em paralelo |

As tasks de typecheck rodam em background e reportam erros diretamente no **Problems panel** do VS Code via `$tsc-watch` problem matcher.

### Editor Settings (`.vscode/settings.json`)

```jsonc
{
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "always",
    "source.organizeImports.biome": "always"
  },
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "material-icon-theme.activeIconPack": "nest"
}
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Obrigatória | Descrição | Default |
|----------|-------------|-----------|---------|
| `PORT` | Não | Porta do servidor | `4000` |
| `FIREBASE_ADMIN_CREDENTIALS` | **Sim** | Credenciais Firebase Admin em base64 | — |
| `FIRESTORE_DB` | **Sim** | Database Firestore (`production` ou `development`) | `development` |
| `MAGIC3T_BACKEND_URL` | **Sim** | URL pública do backend (para heartbeat) | `http://localhost:4000` |
| `HEARTBEAT_RATE` | Não | Intervalo de heartbeat em ms (0 = desabilitado) | `60000` |
| `QUEUE_STATUS_POLLING_RATE` | Não | Intervalo de polling da fila em ms | `6000` |
| `SENTRY_DSN` | Não | DSN do Sentry (se vazio, Sentry desabilitado) | — |
| `PG_HOST` | **Sim** | Host do PostgreSQL | `localhost` |
| `PG_PORT` | Não | Porta do PostgreSQL | `5432` |
| `PG_USER` | **Sim** | Usuário do PostgreSQL | `dev` |
| `PG_PASSWORD` | **Sim** | Senha do PostgreSQL | `let-me-in` |
| `PG_DATABASE` | **Sim** | Nome do banco | `magic3t` |

### Frontend (`frontend/.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | **Sim** | URL do backend (ex: `http://localhost:4000`) |
| `VITE_CDN_URL` | **Sim** | URL do CDN para assets |
| `VITE_FIREBASE_API_KEY` | **Sim** | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Sim** | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | **Sim** | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Sim** | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Sim** | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | **Sim** | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | **Sim** | Firebase measurement ID |
| `VITE_SENTRY_DSN` | Não | DSN do Sentry (só ativo em prod) |
| `SENTRY_AUTH_TOKEN` | Não | Token para upload de sourcemaps |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Não | Sample rate de tracing |
| `VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE` | Não | Sample rate de session replay |

### Migrations (`packages/migrations/.env`)

| Variável | Descrição |
|----------|-----------|
| `PG_HOST` | Host do PostgreSQL |
| `PG_PORT` | Porta |
| `PG_USER` | Usuário |
| `PG_PASSWORD` | Senha |
| `PG_DATABASE` | Nome do banco |

---

## Convenções e Padrões

### Nomenclatura

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Arquivos | `kebab-case.ts` | `auth-service.ts` |
| Classes / Types / Interfaces | `PascalCase` | `AuthService`, `UserRow` |
| Funções / Variáveis | `camelCase` | `handleConnection`, `userId` |
| Constantes globais | `UPPER_SNAKE_CASE` | `CORS_ALLOWED_ORIGINS` |
| Eventos WebSocket | `namespace.action` | `match.move`, `queue.join` |
| Rotas (arquivos) | TanStack Router conventions | `_auth-guarded.tsx`, `$match.tsx` |

### Estrutura de Módulos NestJS

Cada módulo de negócio segue:

```
module-name/
├── module-name.module.ts      # Definição do módulo
├── module-name.service.ts     # Lógica de negócio
├── module-name.controller.ts  # Endpoints REST (se aplicável)
├── module-name.gateway.ts     # WebSocket gateway (se aplicável)
├── dtos/                      # Data Transfer Objects
├── types/                     # Tipos internos
├── events/                    # Eventos internos (EventEmitter)
└── index.ts                   # Barrel exports
```

### Barrel Exports

Cada diretório com `index.ts` exporta sua API pública. Ao import de um módulo, use o barrel:

```typescript
// ✅ Correto
import { AuthService } from '@/modules/auth'

// ❌ Evitar (import direto do arquivo)
import { AuthService } from '@/modules/auth/auth.service'
```

### Componentes React (Atomic Design)

| Nível | Pasta | Descrição |
|-------|-------|-----------|
| Atoms | `components/atoms/` | Componentes primitivos (Spinner, TimerValue) |
| Molecules | `components/molecules/` | Composições simples (GameBoard) |
| Organisms | `components/organisms/` | Composições complexas (Navbar, MatchDetail) |
| Templates | `components/templates/` | Layouts de página completos (Lobby, Game, Profile) |
| UI | `components/ui/` | Primitivos de design system (Button, Dialog, Input, Panel) |

Cada componente fica em sua pasta com `index.ts` para barrel export:

```
spinner/
├── spinner.tsx
└── index.ts    # export { Spinner } from './spinner'
```

### TypeScript

- Backend usa `strictNullChecks: true`, mas `noImplicitAny: false`
- Frontend usa `strict: true` (inclui todos os strict checks)
- Ambos usam `@/` como path alias para `./src/`
- O padrão `Result<T, E>` estilo Rust está disponível globalmente em ambos

---

## Segurança

### Backend

| Mecanismo | Implementação |
|-----------|---------------|
| **Helmet** | Headers HTTP de segurança (CSP, HSTS, X-Frame-Options) |
| **CORS** | Apenas domínios autorizados (`CORS_ALLOWED_ORIGINS`) |
| **Rate Limiting (HTTP)** | ThrottlerModule (10 req/s short, 100 req/min medium) |
| **Rate Limiting (WS)** | WsThrottlerGuard customizado |
| **Auth Guard** | Token Firebase validado em toda request (exceto `@SkipAuth()`) |
| **Validation** | ValidationPipe global + class-validator + Zod |
| **Sanitização** | Mensagens de chat limitadas a 500 chars, trimadas |

### Frontend

| Mecanismo | Implementação |
|-----------|---------------|
| **Auth** | Firebase Client SDK (Google + Email/Password) |
| **Token injection** | `BaseApiClient` injeta `Authorization: Bearer <token>` automaticamente |
| **Error boundaries** | Sentry error handlers no `createRoot` |
| **Container Docker** | `USER node` (non-root) no Dockerfile |

---

## Links para Documentações Detalhadas

| Documento | Conteúdo |
|-----------|----------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitetura completa do projeto, diagramas de fluxo, módulos |
| [`backend/docs/DATABASE.md`](backend/docs/DATABASE.md) | Schema do banco (PostgreSQL + Firestore), tipos, queries |
| [`backend/docs/WEBSOCKETS.md`](backend/docs/WEBSOCKETS.md) | Eventos WebSocket, namespaces, payloads |
| [`backend/docs/ERROR-HANDLING.md`](backend/docs/ERROR-HANDLING.md) | Padrões de tratamento de erro, filters, error codes |
| [`frontend/docs/FRONTEND.md`](frontend/docs/FRONTEND.md) | Detalhes do frontend |
| [`frontend/docs/API-CLIENTS.md`](frontend/docs/API-CLIENTS.md) | Documentação dos API clients REST |
| [`packages/migrations/MIGRATIONS.md`](packages/migrations/MIGRATIONS.md) | Sistema de migrações SQL (criação, aplicação, CI/CD) |
| [`backend/README.md`](backend/README.md) | Visão geral do backend |
| [`frontend/README.md`](frontend/README.md) | Visão geral do frontend |
