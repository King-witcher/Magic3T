# Sistema de Banimento de Usuários

## Visão Geral

Este sistema permite que usuários com role `creator` banir outros usuários do sistema. O banimento pode ser de dois tipos:
- **Temporário**: com duração específica em minutos
- **Permanente**: sem data de expiração

## Funcionalidades Implementadas

### 1. Estrutura de Dados

#### Tipo `UserBan` (Database Schema)
```typescript
export type UserBan = {
  isBanned: boolean        // Se o usuário está banido
  reason?: string          // Motivo do banimento
  bannedAt?: Date         // Data em que foi banido
  expiresAt?: Date        // Data de expiração (undefined = permanente)
  bannedBy?: string       // ID do admin que aplicou o ban
}
```

O campo `ban` foi adicionado ao `UserRow` em [packages/database-types/src/rows/user-row.ts](packages/database-types/src/rows/user-row.ts).

### 2. API Endpoints

#### Banir Usuário
```
POST /admin/ban-user
Authorization: Bearer <token>
```

**Body:**
```json
{
  "userId": "string",           // ID do usuário a ser banido
  "reason": "string",           // Motivo do banimento
  "durationMinutes": number     // Duração em minutos (opcional, omitir para ban permanente)
}
```

**Response:**
```json
{
  "success": true,
  "bannedUntil": "Date"         // Data de expiração (undefined para ban permanente)
}
```

#### Desbanir Usuário
```
POST /admin/unban-user
Authorization: Bearer <token>
```

**Body:**
```json
{
  "userId": "string"            // ID do usuário a ser desbanido
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Proteção de Rotas

O `BanGuard` foi implementado para proteger automaticamente as seguintes áreas:

- **Queue System**:
  - `QueueGateway` (WebSocket)
  - `QueueController` (REST)

- **Match System**:
  - `MatchGateway` (WebSocket)
  - Endpoints específicos em `MatchController`:
    - `GET /matches/current`
    - `GET /matches/me/am-active`

### 4. Validações

#### Restrições de Banimento
- Usuários com role `creator` **não podem ser banidos**
- Apenas usuários autenticados com role `creator` podem banir outros usuários
- O sistema verifica automaticamente se um ban temporário expirou

#### Auto-Desbanimento
Quando um usuário com ban temporário tenta acessar o sistema após a expiração, o sistema automaticamente:
1. Detecta que o ban expirou
2. Atualiza o status `isBanned` para `false`
3. Permite o acesso

## Exemplos de Uso

### Banimento Temporário (24 horas)
```bash
curl -X POST http://localhost:3000/admin/ban-user \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "reason": "Violação das regras de conduta",
    "durationMinutes": 1440
  }'
```

### Banimento Permanente
```bash
curl -X POST http://localhost:3000/admin/ban-user \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "reason": "Uso de cheats detectado"
  }'
```

### Remover Banimento
```bash
curl -X POST http://localhost:3000/admin/unban-user \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

## Arquitetura

### Componentes Principais

1. **AdminService** ([backend/src/modules/admin/admin.service.ts](backend/src/modules/admin/admin.service.ts))
   - `banUser()`: Aplica banimento
   - `unbanUser()`: Remove banimento
   - `isUserBanned()`: Verifica status de banimento

2. **BanGuard** ([backend/src/common/guards/ban.guard.ts](backend/src/common/guards/ban.guard.ts))
   - Guard reutilizável que bloqueia usuários banidos
   - Funciona tanto para HTTP quanto WebSocket
   - Retorna erro 403 (Forbidden) quando usuário está banido

3. **AdminController** ([backend/src/modules/admin/admin.controller.ts](backend/src/modules/admin/admin.controller.ts))
   - Endpoints REST para banir/desbanir
   - Protegido por `AuthGuard` e `AdminGuard`

### Fluxo de Verificação

```
Requisição → AuthGuard → BanGuard → Endpoint
                ↓            ↓
            Valida       Verifica
             Token         Ban
```

## Logs

O sistema registra todas as ações de banimento:

```
[AdminService] User NickName (userId) was temporarily banned by admin adminId. Reason: motivo
[AdminService] User NickName (userId) was permanently banned by admin adminId. Reason: motivo
[AdminService] User NickName (userId) was unbanned
```

## Mensagens de Erro

- `404 Not Found`: Usuário não encontrado
- `403 Forbidden`:
  - Tentativa de banir um creator
  - Usuário está banido
- `400 Bad Request`: Tentativa de desbanir usuário que não está banido

## Considerações de Segurança

1. ✅ Apenas usuários `creator` podem banir
2. ✅ Creators não podem ser banidos
3. ✅ Logs de auditoria para todas as ações
4. ✅ Validação automática de expiração de bans
5. ✅ Proteção em nível de guard (aplicável a HTTP e WebSocket)

## Próximos Passos (Sugestões)

- [ ] Interface de administração no frontend
- [ ] Histórico de banimentos por usuário
- [ ] Notificação ao usuário sobre banimento
- [ ] Dashboard de usuários banidos
- [ ] Appealing system (sistema de recurso contra banimento)
