# Frontend - Sistema de Banimento

## Visão Geral

O frontend do Magic3T agora possui uma interface completa para gerenciar banimentos de usuários. Apenas usuários com role `creator` têm acesso à zona de administração.

## Acesso

### Navegação
- Clique no ícone 👑 **Admin** na navbar
- Ou acesse diretamente: `/admin`
- **Requisito**: Estar logado com role `creator`

## Componentes

### 1. **AdminApiClient**
Localização: `frontend/src/services/clients/admin-api-client.ts`

Métodos disponíveis:
```typescript
banUser(command: BanUserCommand): Promise<BanUserResponse>
unbanUser(userId: string): Promise<void>
listActiveBans(): Promise<ListBansResult>
```

Uso:
```typescript
import { apiClient } from '@/services/clients/api-client'

// Banir usuário
await apiClient.admin.banUser({
  userId: 'user123',
  isPermanent: false,
  durationMs: 604800000, // 7 dias
  reason: 'Comportamento abusivo'
})

// Listar bans
const bans = await apiClient.admin.listActiveBans()

// Desbanir
await apiClient.admin.unbanUser('user123')
```

### 2. **BanUserModal**
Localização: `frontend/src/components/organisms/ban-user-modal/`

Modal para banir um usuário com:
- Input para ID do usuário
- Campo opcional para nickname
- Toggle para banimento permanente/temporário
- Duração em dias (para temporário)
- Motivo do banimento

Uso:
```tsx
import { BanUserModal } from '@/components/organisms'
import { useDialogStore } from '@/contexts/modal-store'

const showDialog = useDialogStore((state) => state.showDialog)

<Button onClick={() => showDialog(<BanUserModal />)}>
  Banir Usuário
</Button>
```

### 3. **BansList**
Localização: `frontend/src/components/organisms/bans-list/`

Lista todos os bans ativos com:
- Nome e ID do usuário banido
- Tipo de ban (Permanente/Temporário)
- Data de expiração (se temporário)
- Motivo do banimento
- Botão para desbanir

Features:
- Carregamento em tempo real
- Invalidação automática ao desbanir
- Formatação de data/hora em pt-BR
- Indicadores visuais (🔴 Permanente, ⏱️ Temporário)

## Página de Administração

Localização: `frontend/src/routes/_auth-guarded/admin/route.tsx`

### Estrutura
```
Zona de Administração
├── [Botão] + Banir Usuário
├── [Lista] Banimentos Ativos
│   ├── Ban 1
│   ├── Ban 2
│   └── Ban n
```

### Fluxo de Uso

1. **Entrar na zona de admin**
   - Navbar → Click em "Admin" (👑)

2. **Banir um usuário**
   - Click no botão "+ Banir Usuário"
   - Preencha o formulário
   - Selecione: Permanente ou Temporário
   - Se temporário, escolha duração em dias
   - Digite o motivo (mín. 5 caracteres)
   - Click em "Banir Usuário"

3. **Visualizar bans ativos**
   - A lista se atualiza automaticamente
   - Mostra todos os bans permanentes e temporários

4. **Desbanir um usuário**
   - Click no ícone 🗑️ (delete) na linha do ban
   - Confirmação acontece silenciosamente
   - Lista se atualiza

## Tratamento de Erros

### Possíveis Erros

| Erro | Causa | Solução |
|------|-------|---------|
| "Usuário não encontrado" | ID do usuário não existe | Verifique o ID |
| "User-already-banned" | Usuário já está banido | Desbanir primeiro |
| "Acesso Negado" | Não é creator | Apenas creators podem acessar |
| Network error | Problema de conexão | Tente novamente |

### Toast/Notificações
- Sucesso ao banir: Feedback visual e modal fecha
- Erro ao banir: Mensagem de erro no modal
- Sucesso ao desbanir: Lista se atualiza

## Estilos e Temas

Os componentes usam variáveis CSS customizadas:
```sass
--bg-primary      // Fundo principal
--bg-secondary    // Fundo secundário
--bg-tertiary     // Fundo terciário
--text-primary    // Texto principal
--text-secondary  // Texto secundário
--border-color    // Cor de borda
--accent-color    // Cor de destaque
--warning-color   // Cor de aviso
```

Responsivo:
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

## TypeScript Types

### BanUserCommand
```typescript
{
  userId: string           // ID do usuário a banir
  isPermanent: boolean     // true = permanente
  durationMs?: number      // Duração em ms (opcional)
  reason: string          // Motivo (mín. 5 caracteres)
}
```

### BanUserResponse
```typescript
{
  userId: string              // ID do usuário
  nickname: string            // Nickname do usuário
  isPermanent: boolean        // Se é permanente
  expiresAt: Date | null      // Data de expiração
  reason: string             // Motivo
}
```

## Exemplos de Uso

### Exemplo 1: Banir por 7 dias
1. Click "+ Banir Usuário"
2. ID: `abc123def456`
3. Nickname: `PlayerName` (opcional)
4. Banimento Permanente: ❌ (desmarcar)
5. Duração: `7`
6. Motivo: `Comportamento abusivo em chat`
7. Click "Banir Usuário"

### Exemplo 2: Banir permanentemente
1. Click "+ Banir Usuário"
2. ID: `xyz789abc123`
3. Nickname: `Cheater` (opcional)
4. Banimento Permanente: ✅ (marcar)
5. Motivo: `Hacking/Cheating detectado via anticheat`
6. Click "Banir Usuário"

### Exemplo 3: Desbanir
1. Na lista de bans, encontre o usuário
2. Click no ícone 🗑️ à direita
3. Usuário é desbloqueado automaticamente

## Performance

- **Lazy loading**: Componentes são carregados sob demanda
- **Query caching**: React Query cache de bans por 5 minutos
- **Otimização**: List virtualization para muitos bans (future)

## Accessibility

- ✅ Labels associados a inputs
- ✅ Estados disabled em inputs
- ✅ Mensagens de erro claras
- ✅ Navegação via teclado
- ✅ ARIA labels em buttons

## Próximas Melhorias

1. **Paginação** - Para listas com muitos bans
2. **Filtros** - Por tipo (permanente/temporário), data, motivo
3. **Busca** - Procurar bans por nickname ou ID
4. **Histórico** - Ver bans expirados/removidos
5. **Relatório** - Exportar lista de bans
6. **Bulk actions** - Banir múltiplos usuários
7. **Confirmação** - Modal de confirmação antes de banir
8. **Notificação** - Notificar criador quando usuário quer fazer appeal
