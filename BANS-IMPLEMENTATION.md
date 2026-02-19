# Sistema de Banimento - Implementação Completa

## 📋 Resumo

Funcionalidade completa de banimento de usuários desenvolvida em **backend** (NestJS) e **frontend** (React). Permite que criadores (`role: creator`) banir outros usuários de forma temporária ou permanente.

---

## 🎯 Funcionalidades

✅ **Banimento Permanente** - Indefinido até desbloqueio manual
✅ **Banimento Temporário** - Com duração em dias configurável
✅ **Interface Web** - Zona de administração intuitiva
✅ **Guard Global** - Bloqueia usuários banidos automaticamente
✅ **Histórico** - Registra todos os banimentos
✅ **Desbloqueio** - Remove banimentos com um clique

---

## 🏗️ Arquitetura

### Backend (`NestJS + Firestore`)

**Pastas criadas/modificadas:**
```
backend/
├── src/
│   ├── infra/database/repositories/
│   │   └── ban/
│   │       ├── ban.repository.ts        (Operações DB)
│   │       └── index.ts
│   ├── modules/admin/
│   │   ├── admin.controller.ts          (3 endpoints)
│   │   ├── admin.module.ts
│   │   ├── ban.service.ts               (Lógica de negócio)
│   │   └── swagger/
│   │       └── ban-commands.ts          (DTOs)
│   └── modules/auth/
│       ├── ban.guard.ts                 (Guard global)
│       └── index.ts                     (Export)
├── docs/
│   └── BANS.md                          (Documentação)
└── [outros arquivos modificados]
```

**Tipos:**
```
packages/
├── database-types/
│   └── src/rows/
│       └── ban-row.ts                   (BanRow type)
└── api-types/
    └── src/controllers/
        └── ban.ts                       (API types)
```

### Frontend (`React + TanStack Query`)

**Pastas criadas/modificadas:**
```
frontend/
├── src/
│   ├── services/clients/
│   │   └── admin-api-client.ts          (API client)
│   ├── components/organisms/
│   │   ├── ban-user-modal/              (Modal de banimento)
│   │   │   ├── ban-user-modal.tsx
│   │   │   ├── ban-user-modal.module.sass
│   │   │   └── index.ts
│   │   └── bans-list/                   (Lista de bans)
│   │       ├── bans-list.tsx
│   │       ├── bans-list.module.sass
│   │       └── index.ts
│   ├── routes/_auth-guarded/
│   │   └── admin/                       (Página de admin)
│   │       ├── route.tsx
│   │       └── admin.module.sass
│   └── [outros arquivos modificados]
└── docs/
    └── BANS.md                          (Documentação)
```

---

## 🔌 Endpoints API

### POST `/admin/bans`
**Banir usuário**
```bash
curl -X POST http://localhost:4000/admin/bans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "isPermanent": false,
    "durationMs": 604800000,
    "reason": "Comportamento abusivo"
  }'
```

### DELETE `/admin/bans/:userId`
**Desbanir usuário**
```bash
curl -X DELETE http://localhost:4000/admin/bans/user123 \
  -H "Authorization: Bearer <token>"
```

### GET `/admin/bans`
**Listar bans ativos**
```bash
curl -X GET http://localhost:4000/admin/bans \
  -H "Authorization: Bearer <token>"
```

---

## 🎨 Interface Frontend

### Página: `/admin`

```
┌─────────────────────────────────────────┐
│ Zona de Administração    [+ Banir Usuário]
├─────────────────────────────────────────┤
│                                         │
│ Banimentos Ativos                       │
│ ┌───────────────────────────────────┐   │
│ │ Username        🔴 Permanente     │ 🗑 │
│ │ user-id-123     Motivo: Hacking  │   │
│ ├───────────────────────────────────┤   │
│ │ Player2         ⏱️ Temporário     │ 🗑 │
│ │ user-id-456     Expira: 06/02... │   │
│ └───────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Modal: Banir Usuário

```
┌──────────────────────────────────┐
│ Banir Usuário                    │
├──────────────────────────────────┤
│ ID do Usuário *                  │
│ [____________________________]    │
│                                  │
│ Nickname (opcional)              │
│ [____________________________]    │
│                                  │
│ [✓] Banimento Permanente        │
│                                  │
│ Duração (dias) *                │
│ [_____]                          │
│                                  │
│ Motivo do Banimento *            │
│ [                              ] │
│ [                              ] │
│                                  │
│ [Cancelar]  [Banir Usuário]     │
└──────────────────────────────────┘
```

---

## 🔐 Segurança

✅ Apenas `creator` pode banir
✅ Guard global bloqueia usuários banidos
✅ Validação de dados com `class-validator`
✅ Autenticação obrigatória
✅ Histórico de bans registrado
✅ Bans temporários verificam `expires_at`

---

## 💾 Banco de Dados

### Collection: `bans`
```javascript
{
  banned_user_id: "user123",
  banned_user_nickname: "PlayerName",
  creator_id: "admin456",
  is_permanent: false,
  reason: "Comportamento abusivo",
  banned_at: Timestamp("2026-01-30T..."),
  expires_at: Timestamp("2026-02-06T...") // null se permanente
}
```

---

## 📦 Tipos TypeScript

### Backend

```typescript
// BanRow (database-types)
type BanRow = {
  banned_user_id: string
  banned_user_nickname: string
  creator_id: string
  is_permanent: boolean
  reason: string
  banned_at: Date
  expires_at: Date | null
}

// BanUserCommand (api-types)
type BanUserCommand = {
  userId: string
  isPermanent: boolean
  durationMs?: number
  reason: string
}

// BanUserResponse (api-types)
type BanUserResponse = {
  userId: string
  nickname: string
  isPermanent: boolean
  expiresAt: Date | null
  reason: string
}
```

### Frontend

```typescript
// Mesmos tipos são reutilizados do backend
import { BanUserCommand, BanUserResponse } from '@magic3t/api-types'
```

---

## 🚀 Como Usar

### Para Criadores (role: creator)

1. **Acessar zona de admin**
   - Navbar → Click em "Admin" (👑)
   - Ou: `http://localhost:3000/admin`

2. **Banir um usuário**
   - Click "+ Banir Usuário"
   - Preencha o formulário
   - Escolha: Permanente ou Temporário
   - Confirme

3. **Desbanir um usuário**
   - Encontre na lista
   - Click no ícone 🗑️
   - Pronto!

### Para Desenvolvedores

#### Usar o API Client
```typescript
import { apiClient } from '@/services/clients/api-client'

// Banir
const response = await apiClient.admin.banUser({
  userId: 'user123',
  isPermanent: false,
  durationMs: 86400000, // 1 dia
  reason: 'Motivo do ban'
})

// Listar
const bans = await apiClient.admin.listActiveBans()

// Desbanir
await apiClient.admin.unbanUser('user123')
```

#### Usar os Componentes
```tsx
import { BansList, BanUserModal } from '@/components/organisms'
import { useDialogStore } from '@/contexts/modal-store'

export function MyAdminPage() {
  const showDialog = useDialogStore((state) => state.showDialog)

  return (
    <>
      <button onClick={() => showDialog(<BanUserModal />)}>
        Banir
      </button>
      <BansList />
    </>
  )
}
```

---

## 📊 Fluxo de Dados

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /admin/bans
       ▼
┌─────────────────────┐
│  AdminController    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   BanService        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  BanRepository      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Firestore (bans)   │
└─────────────────────┘

───────────────────────────────

Próximas requisições:
│ GET /users/<userId>
│         ▼
│    AuthGuard
│         │ verifica token
│         ▼
│    BanGuard (GLOBAL)
│         │ verifica se banido
│         ▼ (se sim: erro 403)
│    RestanteEndpoint
```

---

## ✅ Checklist de Implementação

### Backend
- [x] Tipos `BanRow` criados
- [x] `BanRepository` implementado
- [x] `BanService` implementado
- [x] `AdminController` com endpoints
- [x] `BanGuard` global registrado
- [x] DTOs com validação
- [x] Documentação backend

### Frontend
- [x] `AdminApiClient` implementado
- [x] `BanUserModal` componente
- [x] `BansList` componente
- [x] `/admin` página
- [x] Navbar link configurado
- [x] React Query integration
- [x] Estilos responsivos
- [x] Documentação frontend

### Deploy
- [x] TypeScript sem erros
- [x] Backend build completo
- [x] Frontend build completo
- [x] Sem warnings críticos

---

## 📚 Documentação

- Backend: [backend/docs/BANS.md](../backend/docs/BANS.md)
- Frontend: [frontend/docs/BANS.md](../frontend/docs/BANS.md)

---

## 🎉 Pronto para Produção!

Sistema testado, compilado e pronto para deploy. Todos os tipos estão corretos, endpoints funcionando e interface responsiva.
