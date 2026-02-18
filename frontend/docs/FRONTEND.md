# Frontend - Magic3T

Documentação técnica do frontend do Magic3T.

---

## Stack Principal

| Tecnologia | Propósito |
|------------|-----------|
| **React 19** | UI Library |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e dev server |
| **TanStack Router** | Roteamento type-safe |
| **TanStack Query** | Data fetching, cache e mutations |
| **Tailwind CSS v4** | Estilização utility-first |
| **Firebase Auth** | Autenticação (Google provider) |
| **Socket.IO Client** | Comunicação em tempo real |
| **Radix UI** | Primitivos de UI acessíveis || **Sentry** | Error tracking, performance monitoring e session replay |
---

## Estrutura de Pastas

```
frontend/src/
├── main.tsx                 # Entry point
├── instrument.ts            # 🔍 Inicialização do Sentry (importado antes de tudo)
├── router.ts                # Configuração do router (separado para uso no Sentry)
├── main.css                 # Estilos globais (Tailwind + tema)
├── route-tree.gen.ts        # Rotas geradas automaticamente
│
├── routes/                  # 📍 Páginas (TanStack Router)
│   ├── __root.tsx           # Layout raiz (providers, navbar)
│   ├── _auth.tsx            # Layout para páginas de auth (sign-in, register)
│   ├── _auth-guarded.tsx    # Layout que requer autenticação
│   └── ...
│
├── components/              # 🧱 Componentes React
│   ├── ui/                  # Componentes base (Button, Input, Panel, Dialog)
│   └── templates/           # Templates de página (layouts reutilizáveis)
│
├── contexts/                # 🌐 React Contexts
│   ├── auth-context.tsx     # Estado de autenticação
│   ├── game-context.tsx     # Estado da partida atual
│   ├── queue.context.tsx    # Estado da fila de matchmaking
│   └── ...
│
├── services/                # 🔌 Comunicação externa
│   ├── firebase.ts          # Inicialização Firebase
│   └── clients/             # API clients (REST)
│
├── hooks/                   # 🪝 Custom Hooks
├── lib/                     # 📚 Utilitários e classes
├── types/                   # 📦 Tipos TypeScript
├── utils/                   # 🔧 Funções utilitárias
└── assets/                  # 🖼️ Fontes, texturas
```

---

## Componentes

### Pasta `ui/`

Componentes base reutilizáveis seguindo o padrão **shadcn/ui**:

| Componente | Descrição |
|------------|-----------|
| `Button` | Botão com variantes (primary, secondary, destructive, ghost, outline) |
| `Input` | Campo de texto |
| `Label` | Label para inputs |
| `Panel` | Container estilizado com bordas decorativas |
| `Dialog` | Modal/dialog usando Radix UI |
| `Popover` | Popover flutuante |
| `Tooltip` | Tooltip com Radix UI |
| `ErrorPanel` | Painel de exibição de erros |

**Padrão de desenvolvimento:**
- Usar Radix UI como base para primitivos acessíveis
- Estilização com Tailwind + `cn()` utility
- Props compatíveis com elementos HTML nativos (`ComponentProps<'button'>`)

### Pasta `templates/`

Templates são layouts de página completos e reutilizáveis:

```
templates/
├── root-layout/       # Layout raiz (background, navbar, modais)
├── lobby/             # Tela principal de seleção de modo
├── game/              # Tela de partida
├── profile/           # Tela de perfil
├── loading/           # Estados de loading
├── loading-session/   # Loading enquanto carrega sessão
├── choose-nickname/   # Tela de registro de nickname
├── not-found/         # Página 404
├── store/             # Loja do jogo
└── admin/             # Painel administrativo
```

### Pastas em Migração (Legacy)

> ⚠️ As pastas abaixo estão em processo de migração/remoção:

| Pasta | Status |
|-------|--------|
| `atoms/` | Será removida. Componentes migrarão para `ui/` |
| `molecules/` | Será removida |
| `organisms/` | Componentes serão movidos para `components/` raiz ou `templates/` |

---

## Rotas (TanStack Router)

O TanStack Router gera rotas automaticamente a partir da estrutura de arquivos em `routes/`.

### Estrutura de Layouts

```
__root.tsx                    # Layout raiz (sempre renderiza)
├── _auth.tsx                 # Layout para não-autenticados
│   ├── sign-in.tsx           # /sign-in
│   └── register.tsx          # /register
│
├── _auth-guarded.tsx         # Layout que requer autenticação
│   ├── index.tsx             # / (home/lobby)
│   ├── store.tsx             # /store
│   └── me/route.tsx          # /me (perfil próprio)
│
├── leaderboard.tsx           # /leaderboard (público)
├── tutorial/route.tsx        # /tutorial (público)
├── playground/route.tsx      # /playground (público)
├── users/$nickname.tsx       # /users/:nickname (público)
└── users/id/$userId.tsx      # /users/id/:userId (público)
```

### Layouts Importantes

#### `__root.tsx`
- Renderiza `<Providers>` (todos os contexts)
- Renderiza `<RootLayout>` (background, navbar quando logado)
- Define `notFoundComponent` e `errorComponent`

#### `_auth-guarded.tsx`
- Redireciona para `/sign-in` se não autenticado
- Mostra `<LoadingSessionTemplate>` enquanto carrega
- Mostra `<ChooseNicknameTemplate>` se não registrou nickname

#### `_auth.tsx`
- Redireciona para home se já autenticado
- Layout específico para páginas de login/registro

### Páginas Públicas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/leaderboard` | `leaderboard.tsx` | Ranking dos melhores jogadores |
| `/tutorial` | `tutorial/route.tsx` | Guia de regras e estratégias |
| `/playground` | `playground/route.tsx` | Simulador de partidas offline |
| `/users/:nickname` | `users/$nickname.tsx` | Perfil público de jogador |

#### `/playground` — Simulador de Partidas

Permite simular partidas completas localmente, sem necessidade de autenticação ou conexão com o servidor. Útil para praticar estratégias.

**Funcionalidades:**
- Tabuleiro interativo alternando turnos entre **Order** (azul) e **Chaos** (vermelho)
- Detecta automaticamente o vencedor ao completar um triplo somando 15
- **Navegação no histórico**: avançar/recuar movimentos individualmente ou saltar para início/fim
- **Histórico visual**: painel lateral com todos os movimentos, indicando o ponto atual na linha do tempo; clicar em uma entrada salta para aquele estado
- Botão "Nova Partida" para resetar o tabuleiro
- Indicadores de turno destacam visualmente qual lado está ativo ou venceu

**Estado local (sem persistência):**
```tsx
const [history, setHistory] = useState<Choice[]>([])  // lista completa de movimentos
const [cursor, setCursor]   = useState(0)               // posição atual na linha do tempo
```

- `history.slice(0, cursor)` = movimentos visíveis no tabuleiro
- Índices pares → Order, ímpares → Chaos
- Ao jogar com `cursor < history.length`, os movimentos futuros são descartados

**Componentes utilizados:**
- `<GameBoard>` — tabuleiro 3×3 reutilizado do jogo real
- `<MoveHistory>` (local) — lista rolável de jogadas com cursor visual
- `<Panel>`, `<PanelDivider>`, `<Button>` — primitivos de UI com identidade LoL

---

## Gerenciamento de Estado

### Padrão Definido

| Tipo de Estado | Solução |
|----------------|---------|
| **Dados do servidor** | TanStack Query |
| **Estado global da aplicação** | React Context |
| **Estado local de componente** | `useState` / `useReducer` |

### Contexts Principais

#### `AuthContext`
Gerencia o estado de autenticação:

```typescript
enum AuthState {
  LoadingSession,        // Carregando sessão inicial
  NotSignedIn,           // Não logado
  LoadingUserData,       // Logado, carregando dados do usuário
  SignedInUnregistered,  // Logado mas sem nickname
  SignedIn,              // Totalmente autenticado
}

type AuthContextData = {
  user: GetUserResult | null
  userId: string | null
  signedIn: boolean
  state: AuthState
  refetchUser?: () => Promise<void>
}
```

#### `GameContext`
Gerencia o estado da partida atual via WebSocket:

```typescript
type GameContextData = {
  matchId: string | null
  isActive: boolean
  turn: Team | null
  currentTeam: Team | null
  availableChoices: Choice[]
  finished: boolean
  teams: Record<Team, { timer, profile, choices, gain, score }>

  connect(id: string): void
  disconnect(): void
  pick(choice: Choice): void
  forfeit(): void
}
```

#### `QueueContext`
Gerencia a fila de matchmaking via WebSocket:

```typescript
type QueueContextData = {
  queueModes: QueueModesType
  queueUserCount: UpdateUserCountPayload
  enqueue(mode: QueueMode): void
  dequeue(mode: QueueMode): void
}
```

### TanStack Query

Usado para:
- Fetch de dados do servidor (usuários, partidas, ranking)
- Cache automático
- Revalidação e retry
- Mutations com invalidação de cache

```typescript
// Exemplo de query
const userQuery = useQuery({
  queryKey: ['user-by-id', userId],
  queryFn: () => apiClient.user.getById(userId),
})

// Exemplo de mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.user.updateNickname(data),
  onSuccess: () => queryClient.invalidateQueries(['user']),
})
```

---

## Comunicação com Backend

### API REST (`services/clients/`)

O `BaseApiClient` fornece métodos HTTP com autenticação automática:

```typescript
class BaseApiClient {
  protected get<T>(endpoint, authenticated?): Promise<T>
  protected post<P, R>(endpoint, payload, authenticated?): Promise<R>
  protected patch<P, R>(endpoint, payload, authenticated?): Promise<R>
  protected delete<R>(endpoint, authenticated?): Promise<R>
}
```

**Clientes disponíveis:**
- `apiClient.user` - Operações de usuário
- `apiClient.match` - Operações de partida
- `apiClient.queue` - Operações de fila
- `apiClient.status` - Status do servidor
- `apiClient.crash` - Relatórios de erro

### WebSockets (`useGateway` hook)

Para comunicação em tempo real:

```typescript
const gateway = useGateway<ServerEvents, ClientEvents>('namespace', enabled)

// Escutar eventos
useListener(gateway, 'event-name', (data) => { ... })

// Emitir eventos
gateway.emit('event-name', payload)
```

**Namespaces:**
- `/queue` - Fila de matchmaking
- `/match` - Partidas em tempo real

---

## Autenticação

### Fluxo Completo

```
1. Usuário clica em "Sign in with Google"
              │
              ▼
2. Firebase Auth abre popup do Google
              │
              ▼
3. Usuário autentica, Firebase retorna ID Token
              │
              ▼
4. AuthContext detecta mudança (onAuthStateChanged)
              │
              ▼
5. AuthContext busca dados do usuário no backend
              │
              ├── Usuário existe → SignedIn
              │
              └── Usuário não existe → SignedInUnregistered
                         │
                         ▼
              6. Mostra tela de escolha de nickname
                         │
                         ▼
              7. Após registro → refetchUser() → SignedIn
```

### Componentes Envolvidos

| Componente | Responsabilidade |
|------------|------------------|
| `services/firebase.ts` | Inicialização do Firebase Client SDK |
| `lib/auth-client.ts` | Wrapper para operações de auth |
| `contexts/auth-context.tsx` | Estado global de autenticação |
| `services/clients/base-api-client.ts` | Injeta token em requests |

### Token em Requests

```typescript
// HTTP
headers: { Authorization: `Bearer ${await authClient.token}` }

// WebSocket
socket.handshake.auth = { token: idToken }
```

---

## Estilização

### Tailwind CSS v4

O projeto usa **Tailwind CSS v4** como única solução de estilização.

**Arquivo principal:** `main.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* Cores customizadas */
  /* Fontes */
  /* Animações */
}
```

### Utility `cn()`

Combina classes com `tailwind-merge`:

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className
)} />
```

---

## Identidade Visual

O design do Magic3T é **inspirado na identidade visual do League of Legends**, com foco em elegância e sofisticação.

### Paleta de Cores

#### Azul (Blue)
| Token | Hex | Uso |
|-------|-----|-----|
| `blue-1` | `#cdfafa` | Texto claro, destaques |
| `blue-2` | `#0ac8b9` | Elementos interativos |
| `blue-3` | `#0397ab` | Acentos |
| `blue-4` | `#005a82` | Backgrounds secundários |
| `blue-5` | `#0a323c` | Backgrounds escuros |
| `blue-6` | `#091428` | Backgrounds muito escuros |
| `blue-7` | `#0a1428` | Base escura |

#### Dourado (Gold)
| Token | Hex | Uso |
|-------|-----|-----|
| `gold-1` | `#f0e6d2` | Texto principal |
| `gold-2` | `#cdbe91` | Texto secundário |
| `gold-3` | `#c8aa6e` | Bordas, divisores |
| `gold-4` | `#c89b3c` | Acentos, botões |
| `gold-5` | `#785a28` | Bordas sutis |
| `gold-6` | `#463714` | Backgrounds de botões |
| `gold-7` | `#32281e` | Sombras |

#### Cinza (Grey)
| Token | Hex | Uso |
|-------|-----|-----|
| `grey-1` | `#a09b8c` | Texto desabilitado |
| `grey-1-5` | `#5b5a56` | Bordas sutis |
| `grey-2` | `#3c3c41` | Divisores |
| `grey-3` | `#1e2328` | Backgrounds de painéis |
| `grey-cool` | `#1e282d` | Variação de background |
| `hextech-black` | `#010a13` | Background principal |

### Tipografia

O projeto usa as **fontes oficiais do League of Legends**:

| Fonte | Tipo | Uso | Tailwind Class |
|-------|------|-----|----------------|
| **Beaufort** | Serif | Títulos, headings, logo | `font-serif` |
| **Spiegel** | Sans-serif | Texto corrido, UI | `font-sans` |
| **Source Code Pro** | Monospace | Código, console | `font-mono` |

**Exemplo de uso:**
```tsx
<h1 className="font-serif font-bold text-5xl text-gold-1 uppercase tracking-wider">
  Magic3T
</h1>
<p className="font-sans text-gold-2">
  Descrição do jogo
</p>
```

### Elementos de Design

#### Panel (Container Principal)
```tsx
<Panel>
  {/* Conteúdo */}
</Panel>
```
- Background semi-transparente com blur
- Bordas douradas
- Cantos decorativos em dourado

#### Botões
```tsx
<Button variant="primary">Jogar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="destructive">Sair</Button>
```
- Efeito de "shine" no hover
- Gradientes dourados
- Texto uppercase com tracking

#### Bordas Decorativas
Cantos com linhas douradas são um padrão recorrente:
```tsx
<div className="absolute -top-1 -left-1 w-8 h-8 border-t-3 border-l-3 border-gold-4" />
```

#### Background
- Imagem de fundo temática
- Overlays com blur colorido (azul e dourado)
- Padrão hexagonal sutil

---

## Fluxos Principais

### 1. Entrar em Partida (PvP)

```
Usuário na Lobby
       │
       ▼
Clica em "PvP Match"
       │
       ▼
QueueContext.enqueue('ranked')
       │
       ▼
WebSocket emite 'queue.join'
       │
       ▼
[Aguarda match...]
       │
       ▼
Servidor emite 'queue.matchFound'
       │
       ▼
QueueContext recebe, chama GameContext.connect(matchId)
       │
       ▼
GameContext conecta ao WebSocket /match
       │
       ▼
UI atualiza para tela de partida
```

### 2. Durante Partida

```
GameContext conectado
       │
       ▼
Servidor emite 'match.start' com estado inicial
       │
       ▼
Usuário faz jogada → GameContext.pick(choice)
       │
       ▼
WebSocket emite 'match.move'
       │
       ▼
Servidor emite 'match.sync' com novo estado
       │
       ▼
[Repete até fim...]
       │
       ▼
Servidor emite 'match.report' com resultado
       │
       ▼
UI mostra resultado, atualiza rating
```

---

## Convenções de Código

### Nomenclatura
- **Arquivos:** `kebab-case.tsx`
- **Componentes:** `PascalCase`
- **Hooks:** `useCamelCase`
- **Contexts:** `CamelCaseContext`
- **Funções/variáveis:** `camelCase`

### Estrutura de Componente

```tsx
// Imports
import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Types
interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
}

// Component
export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'base-classes',
        variant === 'primary' && 'primary-classes',
        className
      )}
      {...props}
    />
  )
}
```

### Exports

Cada pasta com `index.ts` exporta sua API pública:
```typescript
// components/ui/index.ts
export * from './button'
export * from './input'
export * from './panel'
```

---

## Observabilidade com Sentry

O frontend utiliza o **Sentry** para monitoramento de erros, performance e comportamento do usuário.

### Configuração

A inicialização do Sentry acontece em [`instrument.ts`](c:\code\pessoal\magic3t\Magic3T\frontend\src\instrument.ts), que é importado **antes de tudo** no [`main.tsx`](c:\code\pessoal\magic3t\Magic3T\frontend\src\main.tsx):

```typescript
// instrument.ts
import * as Sentry from '@sentry/react'
import { router } from './router'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.0,
  replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE) || 0.0,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
})
```

### Variáveis de Ambiente

Configure as seguintes variáveis no `.env`:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SENTRY_DSN` | URL do projeto Sentry | `https://xxx@sentry.io/xxx` |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | % de transações para rastrear (0.0 - 1.0) | `1.0` |
| `VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE` | % de sessões para replay (0.0 - 1.0) | `1.0` |
| `SENTRY_AUTH_TOKEN` | Token para upload de sourcemaps | `sntrys_xxx` |

> ⚠️ O Sentry só é ativado em **produção** (`import.meta.env.PROD`).

### Funcionalidades Ativas

#### 1. Error Tracking
- Captura automática de erros não tratados
- Error boundaries integrados no React
- Callbacks personalizados em `createRoot`:
  ```typescript
  createRoot(rootElement, {
    onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {...}),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
  })
  ```

#### 2. Performance Monitoring
- Rastreamento de navegação com `tanstackRouterBrowserTracingIntegration`
- Monitoramento de transações HTTP
- Métricas de performance (LCP, FID, CLS)

#### 3. Session Replay
- Gravação de sessões de usuários (quando `replaysSessionSampleRate > 0`)
- **Sempre** grava sessões quando ocorre um erro (`replaysOnErrorSampleRate: 1.0`)
- Permite ver o que o usuário fez antes do erro

#### 4. Build-time Features
- Upload automático de sourcemaps via `@sentry/vite-plugin`
- Sourcemaps são gerados em builds de produção
- Configuração em [`vite.config.ts`](c:\code\pessoal\magic3t\Magic3T\frontend\vite.config.ts):
  ```typescript
  sentryVitePlugin({
    org: 'magic3t',
    project: 'magic3t-frontend',
  })
  ```

### Decisões de Design

#### Por que `router.ts` separado?
O Sentry precisa ter acesso ao router **antes** da inicialização do React para instalar a integração do TanStack Router. Por isso, a criação do router foi movida para um arquivo separado.

#### Sourcemaps em Produção
Os sourcemaps são gerados em builds de produção (`sourcemap: true` no Vite) e enviados para o Sentry automaticamente. Eles **não** são servidos publicamente, permitindo debugging detalhado sem expor o código-fonte.

### Próximas Melhorias

- [ ] Implementar tunneling para evitar bloqueio por ad-blockers ([docs](https://docs.sentry.io/platforms/javascript/guides/react/#avoid-ad-blockers-with-tunneling-optional))
- [ ] Configurar tags customizadas para identificar versões e ambientes
- [ ] Adicionar breadcrumbs customizados para ações importantes (ex: jogadas, entradas em fila)
