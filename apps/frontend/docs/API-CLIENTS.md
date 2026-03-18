# API Clients & TanStack Query Abstraction

Documentação sobre como o frontend abstrai o TanStack Query para consumo de API REST.

---

## Visão Geral da Arquitetura

O projeto **não usa** TanStack Query diretamente nos componentes. Em vez disso, existe uma camada de abstração composta por:

1. **`BaseApiClient`** — classe base para todos os clients REST, que encapsula `fetch`, autenticação e tratamento de erros.
2. **Namespace clients** — classes concretas (ex: `ApiUserClient`, `ApiMatchClient`) que herdam de `BaseApiClient` e expõem métodos tipados para cada endpoint.
3. **`useClientQuery`** — hook genérico que conecta qualquer método de um client ao `useQuery` do TanStack Query, com tipagem inferida automaticamente.
4. **`useClientMutation`** — hook genérico que conecta qualquer método de um client ao `useMutation` do TanStack Query, com tipagem inferida automaticamente.

```
┌─────────────────────────────────────────────────┐
│                  Componente React                │
│                                                  │
│  useClientQuery(apiClient.user, 'getById', id)   │
│  useClientMutation(apiClient.user, 'updateIcon', {...}) │
└───────────┬──────────────────────┬──────────────┘
            │                      │
            ▼                      ▼
   ┌────────────────┐    ┌─────────────────┐
   │ useClientQuery │    │useClientMutation│
   │   (hook)       │    │   (hook)        │
   └───────┬────────┘    └───────┬─────────┘
           │                     │
           ▼                     ▼
   ┌─────────────────────────────────────┐
   │         TanStack Query              │
   │   (useQuery / useMutation)          │
   └───────────────┬─────────────────────┘
                   │
                   ▼
   ┌─────────────────────────────────────┐
   │     Namespace Client (ex: ApiUserClient) │
   │     extends BaseApiClient           │
   │     métodos: getById(), getRanking()│
   └───────────────┬─────────────────────┘
                   │
                   ▼
   ┌─────────────────────────────────────┐
   │          BaseApiClient              │
   │   get(), post(), patch(), delete()  │
   │   auth header, error handling       │
   └───────────────┬─────────────────────┘
                   │
                   ▼
              fetch() → API REST
```

---

## Camada 1: `BaseApiClient`

**Arquivo:** `frontend/src/services/clients/base-api-client.ts`

Classe base que encapsula toda a comunicação HTTP. Responsabilidades:

- Construir a URL base a partir do `namespace` (`/user`, `/match`, `/queue`, `/admin`)
- Métodos protegidos `get()`, `post()`, `put()`, `patch()`, `delete()` que delegam para um método privado `request()`
- Injetar automaticamente o header `Authorization: Bearer <token>` quando `authenticated: true` (padrão)
- Converter erros HTTP em classes tipadas (`NotFoundError`, `UnauthorizedError`, etc.)
- Parsear a resposta como JSON automaticamente

```typescript
export class BaseApiClient<Namespace extends ApiNamespace = ApiNamespace> {
  constructor(public readonly namespace: Namespace) {}

  protected async get<T>(endpoint: string, options?: ClientRequestOptions): Promise<T>
  protected async post<TPayload, TResponse>(endpoint: string, payload: TPayload, options?: ClientRequestOptions): Promise<TResponse>
  protected async patch<TPayload, TResponse>(endpoint: string, payload: TPayload, options?: ClientRequestOptions): Promise<TResponse>
  protected async delete<TResponse>(endpoint: string, options?: ClientRequestOptions): Promise<TResponse>
}
```

### `ClientRequestOptions`

```typescript
type ClientRequestOptions = {
  authenticated?: boolean  // default: true — injeta o token de auth
  signal?: AbortSignal     // propagado pelo TanStack Query para cancelamento
}
```

---

## Camada 2: Namespace Clients

**Diretório:** `frontend/src/services/clients/namespaces/`

Cada client corresponde a um namespace da API REST e herda de `BaseApiClient`. Os métodos nesses clients seguem uma **convenção de assinatura** que é essencial para que `useClientQuery` e `useClientMutation` funcionem:

### Convenção para métodos de **query** (usados com `useClientQuery`)

Métodos devem ter uma das seguintes assinaturas:

```typescript
// Sem parâmetros (apenas signal)
async metodo(signal?: AbortSignal): Promise<T>

// Com parâmetros
async metodo(params: P, signal?: AbortSignal): Promise<T>
```

O `signal` no final permite que o TanStack Query cancele a request automaticamente.

### Convenção para métodos de **mutation** (usados com `useClientMutation`)

```typescript
// Sem parâmetros
async metodo(): Promise<T>

// Com parâmetros
async metodo(params: P): Promise<T>
```

### Exemplos de clients existentes

```typescript
// ApiUserClient (namespace: 'user')
class ApiUserClient extends BaseApiClient<'user'> {
  async getById(id: string, signal?: AbortSignal): Promise<GetUserResult>        // query
  async getRanking(signal?: AbortSignal): Promise<ListUsersResult>               // query
  async getMyIcons(signal?: AbortSignal): Promise<number[]>                      // query
  async register(data: RegisterUserCommand): Promise<void>                       // mutation
  async updateIcon(icon: number): Promise<void>                                  // mutation
  async updateNickname(nickname: string): Promise<void>                          // mutation
}

// ApiMatchClient (namespace: 'match')
class ApiMatchClient extends BaseApiClient<'match'> {
  async getById(matchId: string, signal?: AbortSignal): Promise<Match.FindMatchResult>         // query
  async getCurrentMatch(signal?: AbortSignal): Promise<{ id: string }>                         // query
  async listUserMatches(args: { limit; userId }, signal?: AbortSignal): Promise<ListMatchesResult> // query
}

// ApiQueueClient (namespace: 'queue')
class ApiQueueClient extends BaseApiClient<'queue'> {
  async enqueue(queueMode: QueueMode): Promise<void>   // mutation
  async dequeue(): Promise<void>                        // mutation
}

// AdminApiClient (namespace: 'admin')
class AdminApiClient extends BaseApiClient<'admin'> {
  listAccounts(signal?: AbortSignal): Promise<Admin.ListAccountsResult>  // query
}
```

### Client agregador: `ApiClient`

**Arquivo:** `frontend/src/services/clients/api-client.ts`

Agrega todos os namespace clients numa única instância e também tem seus próprios métodos para endpoints sem namespace:

```typescript
class ApiClient extends BaseApiClient<undefined> {
  public readonly user = new ApiUserClient()
  public readonly match = new ApiMatchClient()
  public readonly queue = new ApiQueueClient()
  public readonly admin = new AdminApiClient()

  async getStatus(signal?: AbortSignal): Promise<GetStatusResponse>
  async reportCrash(data: CrashReportCommand): Promise<void>
}

export const apiClient = new ApiClient()
```

A instância singleton `apiClient` é importada diretamente pelos componentes.

---

## Camada 3: `useClientQuery`

**Arquivo:** `frontend/src/hooks/use-client-query.ts`

Hook genérico que conecta **qualquer método de query** de um `BaseApiClient` ao `useQuery` do TanStack Query. A tipagem é **100% inferida** a partir do client e do nome do método.

### Assinatura

```typescript
useClientQuery(client, methodName, options?)           // para métodos sem parâmetros
useClientQuery(client, methodName, params, options?)   // para métodos com parâmetros
```

### Como funciona

1. **Seleção de métodos válidos**: O TypeScript filtra automaticamente apenas métodos cuja assinatura seja `(params, signal) => Promise<T>` ou `(signal) => Promise<T>`.
2. **Query key automática**: A key é gerada como `[namespace, methodName]` ou `[namespace, methodName, params]`, opcionalmente com o `userId` do usuário autenticado (para invalidação por sessão).
3. **Cancelamento**: O `AbortSignal` do TanStack Query é propagado automaticamente para o método do client.
4. **Tipo de retorno enriquecido**: Além do `UseQueryResult` padrão, adiciona:
   - `setData(data)` — atualiza o cache otimisticamente (wrapper de `queryClient.setQueryData`)
   - `invalidate()` — invalida a query no cache (wrapper de `queryClient.invalidateQueries`)

### Opções adicionais

```typescript
type UseClientQueryOptions = Omit<UseQueryOptions, 'queryKey' | 'queryFn'> & {
  authenticated?: boolean  // default: true - inclui userId na query key
}
```

### Exemplos de uso

```typescript
// Sem parâmetros
const query = useClientQuery(apiClient.user, 'getRanking', {
  authenticated: false,
})

// Com parâmetros
const userQuery = useClientQuery(apiClient.user, 'getById', userId)

// Com parâmetros e opções
const userQuery = useClientQuery(apiClient.user, 'getById', userId, {
  enabled: !!userId,
  authenticated: false,
})

// Com parâmetros complexos e query dependente
const matchesQuery = useClientQuery(
  apiClient.match,
  'listUserMatches',
  { limit: 20, userId: userQuery.data?.id ?? '' },
  { staleTime: Infinity, enabled: !!userQuery.data }
)

// Usando o client raiz (sem namespace)
const statusQuery = useClientQuery(apiClient, 'getStatus', {
  refetchInterval: pollRate,
})
```

### Query key gerada

| Chamada | Query Key |
|---------|-----------|
| `useClientQuery(apiClient.user, 'getRanking')` | `['user', 'getRanking', userId]` |
| `useClientQuery(apiClient.user, 'getRanking', { authenticated: false })` | `['user', 'getRanking']` |
| `useClientQuery(apiClient.user, 'getById', '123')` | `['user', 'getById', '123', userId]` |
| `useClientQuery(apiClient, 'getStatus')` | `[undefined, 'getStatus', userId]` |

---

## Camada 4: `useClientMutation`

**Arquivo:** `frontend/src/hooks/use-client-mutation.ts`

Hook genérico que conecta **qualquer método de mutation** de um `BaseApiClient` ao `useMutation` do TanStack Query.

### Assinatura

```typescript
useClientMutation(client, methodName, options)
```

### Como funciona

1. **Seleção de métodos válidos**: Filtra métodos com assinatura `(param?) => Promise<T>` (sem `AbortSignal`).
2. **Mutation key automática**: `[namespace, methodName]`
3. **Bind automático**: O método é automaticamente vinculado ao client via `.bind(client)`.

### Exemplos de uso

```typescript
// Mutation simples
const updateIconMutation = useClientMutation(apiClient.user, 'updateIcon', {
  onMutate() {
    // Atualização otimista: modifica o cache da query antes da resposta
    userQuery.setData((oldData) => ({
      ...oldData!,
      summonerIcon: selectedIcon,
    }))
  },
  onError() {
    // Reverte se falhar
    userQuery.invalidate()
  },
})

// Chamando a mutation
updateIconMutation.mutate(selectedIcon)

// Com callbacks de sucesso/erro
const registerMutation = useClientMutation(apiClient.user, 'register', {
  onSuccess() {
    auth.refetchUser()
    router.navigate({ to: '/tutorial' })
  },
  onError(error) {
    toast.error(error.message)
  },
})
registerMutation.mutate({ nickname })
```

---

## Tratamento de Erros: `ClientError`

**Arquivo:** `frontend/src/services/clients/client-error.ts`

Todos os erros HTTP são convertidos em classes tipadas que herdam de `ClientError`:

| Classe | Status Code |
|--------|-------------|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `RateLimitError` | 429 |
| `InternalServerError` | 500 |

Cada erro contém:
- `request: Request` — a request original
- `response: Response` — a response HTTP
- `errorCode: Promise<string | null>` — código de erro da aplicação (do body JSON)
- `errorDescription: Promise<string | null>` — descrição legível do erro

O TanStack Query recebe `ClientError` como tipo genérico de erro, permitindo type-safe error handling nos callbacks e no `error` retornado pelas queries/mutations.

---

## Como Adicionar um Novo Endpoint

### 1. Adicionar o método ao namespace client

```typescript
// frontend/src/services/clients/namespaces/user-client.ts

// Para query (precisa de signal no final):
async getProfile(userId: string, signal?: AbortSignal): Promise<UserProfile> {
  return this.get(`${userId}/profile`, { signal })
}

// Para mutation (sem signal):
async deleteAccount(): Promise<void> {
  await this.delete('me', { authenticated: true })
}
```

### 2. Usar no componente

```typescript
// Query
const profileQuery = useClientQuery(apiClient.user, 'getProfile', userId)

// Mutation
const deleteMutation = useClientMutation(apiClient.user, 'deleteAccount', {
  onSuccess() { /* ... */ }
})
deleteMutation.mutate()
```

A tipagem dos parâmetros e do retorno é inferida automaticamente do método do client. Não é necessário definir query keys, query functions, nem tipar manualmente nada.

---

## Resumo dos Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `services/clients/base-api-client.ts` | Classe base com fetch, auth e error handling |
| `services/clients/client-error.ts` | Classes de erro tipadas por status HTTP |
| `services/clients/api-client.ts` | Client agregador + instância singleton `apiClient` |
| `services/clients/namespaces/*.ts` | Um client por namespace da API |
| `hooks/use-client-query.ts` | Hook genérico para queries (GET) |
| `hooks/use-client-mutation.ts` | Hook genérico para mutations (POST/PATCH/DELETE) |
