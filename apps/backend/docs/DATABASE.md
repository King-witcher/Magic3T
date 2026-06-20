# Database — Magic3T

O Magic3T usa **PostgreSQL** como banco principal e **Firebase Auth** para autenticação. O Firestore é legado e está sendo desativado — restam apenas `config/rating` e `crash-reports`.

| Camada | Uso | Módulo |
|--------|-----|--------|
| **PostgreSQL** | Usuários, partidas, ícones, ratings, identidades | `infra/database/` |
| **Firebase Auth** | Autenticação (login) | `infra/firebase/` |
| **Firestore** (legado) | Config de rating e crash-reports | `infra/firestore/` |

O schema do PostgreSQL é versionado por migrações em `apps/migrations/` — ver [`MIGRATIONS.md`](../../migrations/MIGRATIONS.md).

---

## PostgreSQL (`DatabaseService`)

`infra/database/database.service.ts` gerencia um **pool de conexões** (`pg`, máx. 20).

**Configuração (env):** `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`. SSL é ativado quando `PG_SSL=true`. Dev local: `docker compose up -d`.

```typescript
class DatabaseService implements IDbClient {
  // Query parametrizada — aceita texto + valores ou { text, values } (ex.: helper `sql``)
  query<T>(text: string, values?: unknown[]): Promise<T[]>
  query<T>(params: { text: string; values: unknown[] }): Promise<T[]>

  // Transação gerenciada (BEGIN/COMMIT, ROLLBACK em erro)
  transaction<T>(cb: (client: IDbClient) => Promise<T>): Promise<T>
}
```

**Repositories** (`infra/database/repositories/`): usuários, identidades, credenciais, ícones, partidas e snapshots de rating. Os tipos de linha ficam em `@magic3t/database-types` (`UserRow`, `MatchRow`, `IconRow`, ...).

---

## Escrevendo SQL

Dois jeitos de montar queries (`shared/database/`), ambos vinculando os valores como parâmetros (`$1`, `$2`, ...) — nunca interpolando.

### `sql` — template simples

Para queries fixas. Retorna `{ text, values }`, pronto para `query()`:

```typescript
const [user] = await this.databaseService.query<UserRow>(sql`
  SELECT * FROM "user" WHERE id = ${id}
`)
```

`prepared(name)` gera uma variante que nomeia o prepared statement.

### `PgChain` — builder encadeável

Para queries dinâmicas (filtros opcionais, paginação). As funções de entrada (`SELECT`, `INSERT_INTO`, `UPDATE`, `DELETE_FROM`, `WHERE`, `EXISTS`, `WITH_RECURSIVE`) retornam um `PgChain` encadeável por cláusula: `FROM`, `JOIN`/`LEFT_JOIN`/`ON`, `WHERE`/`AND`/`OR`, `GROUP_BY`, `ORDER_BY`, `LIMIT`/`OFFSET`, `VALUES`, `ON_CONFLICT`/`DO_NOTHING`, `RETURNING`, `SET`, `AS`, `UNION`.

```typescript
const rows = await this.databaseService.query<UserRow>(
  SELECT`*`.FROM`"user"`
    .WHERE`role != 'bot'`
    .if(!!search, (q) => q.AND`profile_nickname ILIKE ${`%${search}%`}`)
    .ORDER_BY`mmr_score DESC`
    .LIMIT`${limit}`
)
```

Atalhos:
- `.if(cond, (q) => ...)` — aplica a cláusula só se `cond` for verdadeiro.
- `INSERT_INTO('"user"', { ...row })` — monta colunas e `VALUES` a partir de um objeto (aceita múltiplas linhas).
- `.SET({ ...campos })` — monta `col = $1, ...` a partir de um objeto.

O builder expõe `.text` e `.values` — então passe direto para `query({ text, values })`, ou use o overload `query(text, values)`.

> Valores em `${...}` viram parâmetros. Fragmentos crus (identificadores, `ASC`/`DESC`) usam o helper `chain` (importado como `raw`): `` raw`u.created_at` ``. **Nunca** passe entrada de usuário por `raw`.

---

## Firebase Auth

Login validado por `FirebaseAuthService.validateToken()`. Cada usuário é ligado à conta Firebase pela tabela `legacy_user_identity` (`firebase_id`).

---

## Firestore (legado, em remoção)

| Repository | Dado | Arquivo |
|------------|------|---------|
| `ConfigRepository` | `config/rating` (config do ELO) | `firestore/repositories/config/` |
| `CrashReportsRepository` | `crash-reports` | `firestore/repositories/crash-report/` |

`FirestoreService.getTemporalId()` ainda é usado em memória para gerar IDs temporais ordenáveis (Base62).
