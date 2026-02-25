# Migrations — Magic3T

Sistema de migrações SQL do Magic3T. Gerencia a evolução do schema do PostgreSQL de forma versionada, sequencial e transacional.

---

## Visão geral

O módulo `packages/migrations` é um pacote independente dentro do monorepo responsável por criar e aplicar migrações SQL puras. Não utiliza ORMs — as migrações são arquivos `.sql` versionados por timestamp, aplicados em ordem cronológica dentro de uma transação.

### Estrutura do pacote

```
packages/migrations/
├── scripts/
│   ├── generate.ts          # Gera uma nova migração (up.sql + down.sql)
│   ├── migrate.ts           # Executa migrações pendentes
│   └── utils/
│       ├── db.ts            # Pool de conexões PostgreSQL (pg)
│       └── migrations.ts    # Lógica de leitura e controle de migrações
├── sql/                     # Diretório das migrações (uma pasta por migração)
│   └── YYYY-MM-DD-NNNNN_nome-da-migracao/
│       ├── up.sql           # SQL para aplicar a migração
│       └── down.sql         # SQL para reverter a migração
├── .env                     # Variáveis de ambiente locais (não versionado)
├── .env.example             # Template das variáveis necessárias
├── package.json
└── tsconfig.json
```

---

## Nomenclatura das migrações

Cada migração é um diretório dentro de `sql/` com o formato:

```
YYYY-MM-DD-DIGEST_nome-da-migracao
```

- **YYYY-MM-DD** — Data de criação.
- **DIGEST** — Inteiro derivado do horário de criação (`(hora * 60 + minuto) * 60 + segundo) * 10 + décimos`). Garante ordenação única mesmo com múltiplas migrações no mesmo dia.
- **nome-da-migracao** — Descrição curta passada como argumento no momento da criação.

As migrações são ordenadas lexicograficamente por nome de diretório, o que preserva a ordem cronológica.

---

## Scripts disponíveis

| Comando | Escopo | Descrição |
|---------|--------|-----------|
| `npm run new <nome>` | `packages/migrations` | Cria uma nova migração |
| `npm run migrate` | `packages/migrations` | Aplica migrações pendentes (usa `.env` local) |
| `npm run migrate:production` | `packages/migrations` | Aplica migrações pendentes (usa variáveis de ambiente do sistema) |
| `npm run migrate` | raiz do monorepo | Atalho para `migrate` do workspace |
| `npm run migrate:production` | raiz do monorepo | Atalho para `migrate:production` do workspace |

### Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PG_HOST` | Host do PostgreSQL | — |
| `PG_PORT` | Porta | `5432` |
| `PG_USER` | Usuário | — |
| `PG_PASSWORD` | Senha | — |
| `PG_DATABASE` | Nome do banco | — |
| `PG_SSL` | Habilita SSL (`"true"` / `"false"`) | `false` |

Para desenvolvimento local, copie `.env.example` para `.env` e preencha com as credenciais do banco local (Docker Compose).

---

## Como funciona a aplicação de migrações

1. Cria a tabela `_migrations` caso não exista.
2. Lista todos os diretórios em `sql/`, ordenados lexicograficamente.
3. Consulta a tabela `_migrations` para obter as migrações já aplicadas (que não foram revertidas).
4. Filtra apenas as migrações pendentes.
5. Aplica todas as pendentes **dentro de uma única transação**:
   - Executa o conteúdo de `up.sql`.
   - Insere um registro na tabela `_migrations`.
6. Se qualquer migração falhar, toda a transação sofre **rollback** — nenhuma migração parcial é aplicada.

### Tabela `_migrations`

```sql
CREATE TABLE IF NOT EXISTS _migrations (
    id             SMALLINT GENERATED ALWAYS AS IDENTITY,
    name           TEXT                     NOT NULL,
    applied_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    rolled_back_at TIMESTAMP WITH TIME ZONE
);
```

---

## Fluxo de trabalho

### Criando uma nova migração

Use a VS Code Task **"Create Migration"** (ícone 🗄️ amarelo) ou execute manualmente:

```bash
npm run new -- nome-da-migracao     # de dentro de packages/migrations
npm run new -w packages/migrations -- nome-da-migracao  # da raiz
```

Isso criará um diretório em `sql/` com os arquivos `up.sql` e `down.sql` pré-preenchidos com comentários. Edite o `up.sql` com os comandos SQL desejados e o `down.sql` com os comandos de rollback correspondentes.

### Aplicando migrações localmente

Use a VS Code Task **"Run Migrations"** (ícone 🗄️ azul) ou execute manualmente:

```bash
npm run migrate                       # de dentro de packages/migrations (usa .env)
npm run migrate                       # da raiz do monorepo (atalho)
```

### Aplicando migrações em produção

As migrações de produção são aplicadas **automaticamente** via GitHub Actions quando há push na branch `main` com alterações em `packages/migrations/**`.

---

## VS Code Tasks

Duas tasks estão configuradas em `.vscode/tasks.json` para facilitar o fluxo:

| Task | Ícone | Ação |
|------|-------|------|
| **Create Migration** | 🗄️ amarelo | Solicita um nome e gera uma nova migração em `sql/` |
| **Run Migrations** | 🗄️ azul | Executa `npm run migrate` para aplicar migrações pendentes no banco local |

As tasks podem ser executadas via `Ctrl+Shift+P` → **Tasks: Run Task** ou pelo painel de tasks do VS Code.

---

## CI/CD — GitHub Actions

O workflow `.github/workflows/migrations.yml` automatiza a aplicação de migrações no banco de produção.

### Gatilhos

- **Push na `main`** com alterações em `packages/migrations/**` ou no próprio workflow.
- **`workflow_dispatch`** — execução manual pelo GitHub Actions UI.

### Pipeline

```
Checkout → Setup Node.js (com cache npm) → Install deps (workspace isolado) → Run migrations
```

As credenciais do banco de produção são injetadas via **GitHub Secrets**:

| Secret | Variável |
|--------|----------|
| `PG_HOST` | Host do Neon PostgreSQL |
| `PG_PORT` | Porta |
| `PG_USER` | Usuário |
| `PG_DATABASE` | Nome do banco |
| `PG_PASSWORD` | Senha |

O script `migrate:production` é usado (em vez de `migrate`) porque lê as variáveis diretamente do ambiente do sistema — sem dependência de arquivo `.env`.

---

## Checklist para novas migrações

1. Crie a migração: Task **"Create Migration"** ou `npm run new <nome>`.
2. Escreva o SQL em `up.sql` e o rollback correspondente em `down.sql`.
3. Teste localmente: Task **"Run Migrations"** ou `npm run migrate`.
4. Faça commit e push para `main`.
5. A GitHub Action aplicará a migração automaticamente no banco de produção.
