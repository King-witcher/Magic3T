# Database - Magic3T

Este documento descreve a estrutura do banco de dados Firestore utilizado pelo Magic3T.

---

## Visão Geral

| Aspecto | Tecnologia/Detalhe |
|---------|-------------------|
| **Database** | Firebase Firestore |
| **Tipos** | `@magic3t/database-types` |
| **Repositories** | `backend/src/infra/firestore/repositories/` |

---

## Collections

```
firestore/
├── users/                      # Usuários do sistema
│   └── {userId}/
│       └── icon_assignments/   # Subcollection: ícones desbloqueados
├── matches/                    # Histórico de partidas
├── config/                     # Configurações globais
│   ├── bots                    # Configuração dos bots
│   └── rating                  # Configuração do sistema de rating
└── crash-reports/              # Relatórios de erro
```

---

## Collection: `users`

Armazena os dados dos usuários do sistema (jogadores, bots e criadores).

### Documento

**ID**: UID do Firebase Authentication (gerado pelo Firebase Auth)

**Tipo**: `UserRow`

```typescript
type UserRow = {
  identification: {
    unique_id: string      // Slug do nickname (lowercase, sem espaços)
    nickname: string       // Nome de exibição
    last_changed: Date     // Última alteração do nickname
  }

  experience: number       // XP acumulado

  magic_points: number     // Créditos comprados com dinheiro
  perfect_squares: number  // Créditos ganhos jogando

  summoner_icon: number    // ID do ícone escolhido pelo usuário

  role: UserRole           // 'player' | 'creator' | 'bot'

  elo: UserRowElo          // Dados de rating (ver abaixo)

  stats: {
    wins: number
    draws: number
    defeats: number
  }
}
```

### Campo `elo` (UserRowElo)

```typescript
type UserRowElo = {
  score: number       // Pontuação ELO atual
  matches: number     // Quantidade de partidas ranqueadas jogadas
  k: number           // K-factor atual (volatilidade do rating)
  challenger: boolean // Se o jogador é Challenger (atualizado diariamente)
}
```

### Enum `UserRole`

```typescript
enum UserRole {
  Player = 'player',   // Jogador comum
  Creator = 'creator', // Criador/Admin
  Bot = 'bot',         // Bot
}
```

### Subcollection: `users/{userId}/icon_assignments`

Registra os ícones desbloqueados por um usuário.

**ID do documento**: ID do ícone (string numérica, ex: `"1"`, `"42"`)

**Tipo**: `IconAssignmentRow`

```typescript
type IconAssignmentRow = {
  date: Date  // Data em que o ícone foi desbloqueado
}
```

### Queries Importantes

| Query | Campos utilizados | Descrição |
|-------|-------------------|-----------|
| Por nickname | `identification.unique_id` | Busca usuário pelo slug |
| Challengers | `elo.challenger == true` | Lista todos os Challengers |
| Ranking | `elo.score` (desc), `elo.matches > X`, `role != 'bot'` | Top jogadores |

---

## Collection: `matches`

Armazena o histórico de partidas jogadas.

### Documento

**ID**: Gerado por `DatabaseService.getTemporalId()` - ID temporal ordenável (6+ caracteres, ordenação decrescente por tempo)

**Tipo**: `MatchRow`

```typescript
type MatchRow = {
  [Team.Order]: MatchRowTeam  // Dados do jogador Order (índice 0)
  [Team.Chaos]: MatchRowTeam  // Dados do jogador Chaos (índice 1)
  events: MatchRowEvent[]     // Eventos da partida
  winner: Team | null         // Vencedor (null = empate)
  game_mode: MatchRowGameMode // Modo de jogo
  timestamp: Date             // Data/hora da partida
}
```

### Tipo `MatchRowTeam`

Snapshot dos dados de cada jogador no momento da partida:

```typescript
interface MatchRowTeam {
  uid: string          // ID do usuário
  name: string         // Nickname no momento da partida
  league: League       // Liga no momento da partida
  division: number | null // Divisão (null para Master/Challenger)
  score: number        // ELO no momento da partida
  lp_gain: number      // LP ganho/perdido na partida
}
```

### Tipo `MatchRowEvent`

Eventos que ocorreram durante a partida:

```typescript
type MatchRowEvent = {
  event: MatchRowEventType  // Tipo do evento
  side: Team                // Qual lado executou (Order/Chaos)
  time: number              // Timestamp do evento (ms desde início)
} & (
  | { event: MatchRowEventType.Choice; choice: Choice }  // Escolha 1-9
  | { event: MatchRowEventType.Message; message: string } // Mensagem
  | { event: MatchRowEventType.Timeout }                  // Timeout
  | { event: MatchRowEventType.Forfeit }                  // Desistência
)
```

### Enum `MatchRowEventType`

```typescript
enum MatchRowEventType {
  Choice = 0,   // Jogador fez uma escolha
  Forfeit = 1,  // Jogador desistiu
  Timeout = 2,  // Jogador perdeu por tempo
  Message = 3,  // Jogador enviou mensagem
}
```

### Enum `MatchRowGameMode`

```typescript
enum MatchRowGameMode {
  Casual = 0b00,  // Partida casual
  Ranked = 0b10,  // Partida ranqueada
  PvP = 0b00,     // Player vs Player
  PvC = 0b01,     // Player vs Computer (Bot)
}
```

### Queries Importantes

| Query | Campos utilizados | Descrição |
|-------|-------------------|-----------|
| Por usuário | `0.uid` ou `1.uid` (Filter.or) | Partidas de um jogador |

---

## Collection: `config`

Configurações globais do sistema. Contém documentos fixos (não são criados dinamicamente).

### Documento: `config/bots`

Configuração dos bots disponíveis.

**Tipo**: `BotConfigRow`

```typescript
type BotConfigRow = Record<BotName, SingleBotConfig>

// Onde BotName é:
enum BotName {
  Bot0 = 'bot0',
  Bot1 = 'bot1',
  Bot2 = 'bot2',
  Bot3 = 'bot3',
}

// E SingleBotConfig é:
type SingleBotConfig = { uid: string } & (
  | { model: 'lmm'; depth: number }  // Bot Minimax com profundidade
  | { model: 'random' }               // Bot de jogadas aleatórias
)
```

**Exemplo de documento**:
```json
{
  "bot0": { "uid": "abc123", "model": "random" },
  "bot1": { "uid": "def456", "model": "lmm", "depth": 2 },
  "bot2": { "uid": "ghi789", "model": "lmm", "depth": 4 },
  "bot3": { "uid": "jkl012", "model": "lmm", "depth": 6 }
}
```

### Documento: `config/rating`

Configuração do sistema de rating/ELO.

**Tipo**: `RatingConfigRow`

```typescript
interface RatingConfigRow {
  initial_elo: number        // ELO inicial para novos jogadores
  elo_per_league: number     // Quantidade de ELO por liga
  initial_league_index: number // Índice da liga inicial
  least_k_factor: number     // K-factor mínimo (jogadores veteranos)
  initial_k_factor: number   // K-factor inicial (novos jogadores)
  k_deflation_factor: number // Fator de deflação do K por partida
}
```

**Exemplo de documento**:
```json
{
  "initial_elo": 1200,
  "elo_per_league": 400,
  "initial_league_index": 2,
  "least_k_factor": 16,
  "initial_k_factor": 40,
  "k_deflation_factor": 0.95
}
```

---

## Collection: `crash-reports`

Armazena relatórios de erros do sistema.

### Documento

**ID**: Gerado por `DatabaseService.getTemporalId()`

**Tipo**: `CrashReportRow`

```typescript
type CrashReportRow = {
  source: 'client' | 'server'  // Origem do erro
  date: Date                   // Data/hora do erro
  error: object                // Objeto de erro serializado
  metadata: object | null      // Metadados adicionais (contexto)
}
```

---

## Tipos Compartilhados (de `@magic3t/common-types`)

### Team

```typescript
enum Team {
  Order = 0,  // Primeiro jogador
  Chaos = 1,  // Segundo jogador
}
```

### Choice

```typescript
type Choice = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

Representa as 9 escolhas possíveis no jogo (números de 1 a 9).

### League

```typescript
enum League {
  Provisional = 'provisional',  // Sem liga definida ainda
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond',
  Master = 'master',
  Challenger = 'challenger',    // Top players
}
```

### Division

```typescript
type Division = 1 | 2 | 3 | 4
```

Divisões dentro de cada liga (exceto Master e Challenger que não têm divisões).

---

## Repositories

Os repositories encapsulam o acesso ao Firestore e ficam em `backend/src/infra/firestore/repositories/`.

| Repository | Collection | Arquivo |
|------------|------------|---------|
| `UserRepository` | `users` | `user/user.repository.ts` |
| `MatchRepository` | `matches` | `match/match.repository.ts` |
| `ConfigRepository` | `config` | `config/config.repository.ts` |
| `CrashReportsRepository` | `crash-reports` | `crash-report/crash-reports-repository.ts` |

### BaseFirestoreRepository

Classe base abstrata com operações comuns:

```typescript
abstract class BaseFirestoreRepository<T> {
  getById(id: string): Promise<GetResult<T> | null>
  listAll(): Promise<ListResult<T>>
  create(doc: T): Promise<string>  // Gera ID temporal
  set(id: string, doc: T): Promise<void>
  update(id: string, data: UpdateData<T>): Promise<void>
}
```

### Tipos de Retorno

```typescript
type GetResult<T> = {
  id: string
  createdAt: Date
  updatedAt: Date
  data: T
}

type ListResult<T> = GetResult<T>[]
```

---

## Geração de IDs

### IDs de Usuários
- Gerados pelo **Firebase Authentication**
- Formato: UID do Firebase (ex: `"abc123def456"`)

### IDs de Matches e Crash Reports
- Gerados por `DatabaseService.getTemporalId()`
- Formato: Base62 invertido + nonce (6+ caracteres)
- **Ordenação**: Decrescente por tempo (documentos mais recentes aparecem primeiro na ordenação natural do Firestore)

---

## Caching

O `ConfigRepository` utiliza cache para reduzir leituras:

| Método | TTL |
|--------|-----|
| `getBotConfigs()` | 300s (5 min) |
| `cachedGetRatingConfig()` | 300s (5 min) |

O caching é implementado via decorator `@CacheMethod(seconds)`.
