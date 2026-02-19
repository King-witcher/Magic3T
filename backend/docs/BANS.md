# Sistema de Banimento de Usuários

## Visão Geral

O sistema de banimento permite que usuários com role `creator` (criadores/admins) banir outros usuários de forma temporária ou permanente.

## Tipos de Banimento

### 1. Banimento Permanente
- O usuário é banido indefinidamente
- Não há data de expiração
- Só pode ser removido manualmente pelo creator

### 2. Banimento Temporário
- O usuário é banido por um período determinado (em milissegundos)
- Exemplos de durações:
  - 7 dias: `604800000` ms
  - 24 horas: `86400000` ms
  - 1 hora: `3600000` ms
- O usuário é desbloqueado automaticamente após a expiração

## Arquitetura

### Database Schema (Firestore)

```
firestore/
├── bans/                       # Collection de banimentos
│   └── {banId}/
│       ├── banned_user_id      # ID do usuário banido
│       ├── banned_user_nickname # Nickname no momento do banimento
│       ├── creator_id          # ID do criador que fez o banimento
│       ├── is_permanent        # boolean (true = permanente)
│       ├── reason              # Motivo do banimento
│       ├── banned_at           # Data/hora do banimento
│       └── expires_at          # Data de expiração (null se permanente)
```

### Tipo `BanRow`

```typescript
type BanRow = {
  banned_user_id: string      // ID do usuário banido
  banned_user_nickname: string // Nickname no momento do ban
  creator_id: string          // ID do creator que baniu
  is_permanent: boolean       // true = permanente, false = temporário
  reason: string              // Motivo do banimento
  banned_at: Date             // Data do banimento
  expires_at: Date | null     // Data de expiração (null se permanente)
}
```

## Implementação

### Backend

#### 1. Repository (`BanRepository`)
Localização: `backend/src/infra/database/repositories/ban/ban.repository.ts`

Métodos principais:
- `getActiveBansForUser(userId)` - Verifica se usuário tem ban ativo
- `getAllActiveBans()` - Lista todos os bans ativos
- `banUser(...)` - Cria um novo banimento
- `unbanUser(userId)` - Remove todos os bans de um usuário

#### 2. Service (`BanService`)
Localização: `backend/src/modules/admin/ban.service.ts`

Métodos principais:
- `isUserBanned(userId)` - Verifica se usuário está banido
- `getActiveBanForUser(userId)` - Obtém dados do ban ativo
- `banUser(...)` - Bane um usuário
- `unbanUser(userId)` - Desbanir um usuário
- `listActiveBans()` - Lista todos os bans ativos

#### 3. Guard (`BanGuard`)
Localização: `backend/src/modules/auth/ban.guard.ts`

- Guard global que verifica se usuário está banido em todo acesso autenticado
- Aplicado automaticamente em todos os endpoints HTTP e WebSocket
- Retorna erro 403 se usuário está banido

#### 4. Controller (`AdminController`)
Localização: `backend/src/modules/admin/admin.controller.ts`

Endpoints:
- `POST /admin/bans` - Banir um usuário
- `DELETE /admin/bans/:userId` - Desbanir um usuário
- `GET /admin/bans` - Listar todos os bans ativos

## API Endpoints

### POST /admin/bans
**Descrição:** Banir um usuário

**Autenticação:** Bearer token (usuário com role `creator`)

**Request Body:**
```json
{
  "userId": "user-id",
  "isPermanent": false,
  "durationMs": 604800000,
  "reason": "Comportamento abusivo"
}
```

**Parâmetros:**
- `userId` (string, obrigatório): ID do usuário a banir
- `isPermanent` (boolean, obrigatório): Se é banimento permanente
- `durationMs` (number, opcional): Duração em ms para bans temporários
- `reason` (string, obrigatório): Motivo do banimento (mín. 5 caracteres)

**Response (200):**
```json
{
  "userId": "user-id",
  "nickname": "username",
  "isPermanent": false,
  "expiresAt": "2026-02-06T10:30:00.000Z",
  "reason": "Comportamento abusivo"
}
```

**Códigos de Erro:**
- `404` - Usuário a banir não encontrado
- `400` - Usuário já está banido
- `403` - Não tem permissão (precisa ser creator)

---

### DELETE /admin/bans/:userId
**Descrição:** Remover banimento de um usuário

**Autenticação:** Bearer token (usuário com role `creator`)

**Path Parameters:**
- `userId` (string): ID do usuário a desbanir

**Response (200):** Sem conteúdo

**Códigos de Erro:**
- `404` - Usuário não encontrado
- `400` - Usuário não está banido
- `403` - Não tem permissão (precisa ser creator)

---

### GET /admin/bans
**Descrição:** Listar todos os banimentos ativos

**Autenticação:** Bearer token (usuário com role `creator`)

**Response (200):**
```json
{
  "data": [
    {
      "userId": "user-id-1",
      "nickname": "username1",
      "isPermanent": true,
      "expiresAt": null,
      "reason": "Comportamento tóxico"
    },
    {
      "userId": "user-id-2",
      "nickname": "username2",
      "isPermanent": false,
      "expiresAt": "2026-02-06T10:30:00.000Z",
      "reason": "Spam"
    }
  ]
}
```

## Comportamento

### Quando um usuário é banido

1. Um registro é criado na collection `bans`
2. O BanGuard impede qualquer acesso do usuário
3. Se for temporário, a data de expiração é calculada
4. Mensagem de erro é retornada em qualquer tentativa de acesso

### Quando um usuário tenta acessar o jogo estando banido

```
403 Forbidden
{
  "code": "user-banned",
  "message": "You have been permanently banned from the game"
  // ou
  "message": "You have been banned until 2026-02-06T10:30:00.000Z"
}
```

### Quando um banimento temporário expira

- O usuário pode acessar normalmente
- O registro do banimento permanece no banco de dados (histórico)
- As queries sempre filtram por `expires_at > now`

## Exemplos de Uso

### Banir um usuário por 7 dias
```bash
curl -X POST http://localhost:4000/admin/bans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "abc123",
    "isPermanent": false,
    "durationMs": 604800000,
    "reason": "Comportamento abusivo em chat"
  }'
```

### Banir um usuário permanentemente
```bash
curl -X POST http://localhost:4000/admin/bans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "abc123",
    "isPermanent": true,
    "reason": "Hacking/Cheating"
  }'
```

### Listar todos os bans ativos
```bash
curl -X GET http://localhost:4000/admin/bans \
  -H "Authorization: Bearer <token>"
```

### Remover banimento
```bash
curl -X DELETE http://localhost:4000/admin/bans/abc123 \
  -H "Authorization: Bearer <token>"
```

## Segurança

- ✅ Apenas users com role `creator` podem banir/desbanir
- ✅ O guard global bloqueia acesso de usuários banidos
- ✅ Bans temporários são verificados contra a hora atual
- ✅ Histórico de banimentos é mantido no banco de dados
- ✅ Motivo do banimento é registrado para auditoria
- ✅ Validação de dados com class-validator

## Próximas Melhorias

1. **Frontend** - Criar interface para gerenciamento de bans
2. **Notificações** - Notificar usuário quando é banido
3. **Appeals** - Sistema de apelação para banimentos
4. **Audit Log** - Log detalhado de todas as ações de ban
5. **IP Bans** - Banir por IP além de user ID
6. **Soft Ban** - Banimento de ranked queue apenas
