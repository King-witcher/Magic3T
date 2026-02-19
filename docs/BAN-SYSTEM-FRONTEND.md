# Sistema de Banimento - Frontend

## Visão Geral

Interface de usuário para gerenciar banimentos de usuários no sistema Magic3T.

## Componentes Implementados

### 1. API Client

**Arquivo**: [frontend/src/services/clients/api-client.ts](frontend/src/services/clients/api-client.ts)

```typescript
// Métodos disponíveis
apiClient.admin.banUser(userId, reason, durationMinutes?)
apiClient.admin.unbanUser(userId)
```

### 2. Componentes UI

#### BanUserDialog
**Arquivo**: [frontend/src/components/organisms/admin/ban-user-dialog.tsx](frontend/src/components/organisms/admin/ban-user-dialog.tsx)

Modal para banir usuários com as seguintes opções:
- Campo de texto para motivo do banimento (obrigatório, máx 200 caracteres)
- Checkbox para banimento permanente
- Campo de duração em minutos (quando não permanente)
- Validações de formulário
- Feedback visual de loading e erros

**Props**:
```typescript
interface BanUserDialogProps {
  userId: string
  userNickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
```

#### UserManagementCard
**Arquivo**: [frontend/src/components/organisms/admin/user-management-card.tsx](frontend/src/components/organisms/admin/user-management-card.tsx)

Card que exibe informações do usuário com ações de gerenciamento:
- Exibe nickname, ID, rating e estatísticas
- Badges para roles especiais (CREATOR, BOT)
- Botões para banir/desbanir usuários
- Proteção: não permite banir creators ou bots

**Props**:
```typescript
interface UserManagementCardProps {
  user: GetUserResult | ListUsersResultData
}
```

#### BanNotificationHandler
**Arquivo**: [frontend/src/components/organisms/ban-notification-handler.tsx](frontend/src/components/organisms/ban-notification-handler.tsx)

Componente global que:
- Detecta erros 403 (Forbidden) relacionados a banimento
- Exibe modal informativo quando usuário está banido
- Faz logout automático do usuário banido
- Escuta erros tanto síncronos quanto assíncronos

### 3. Página de Administração

**Arquivo**: [frontend/src/routes/_auth-guarded/admin.tsx](frontend/src/routes/_auth-guarded/admin.tsx)

**Rota**: `/admin`

**Funcionalidades**:
- ✅ Restrição de acesso apenas para creators
- ✅ Busca de usuários por nickname ou ID
- ✅ Listagem de todos os usuários (via ranking)
- ✅ Gerenciamento inline de banimentos
- ✅ Interface responsiva e intuitiva

**Características**:
- Campo de busca para encontrar usuários específicos
- Lista todos os usuários quando não há busca ativa
- Botão "Clear" para limpar resultados de busca
- Contador de usuários exibidos
- Mensagem de "Access Denied" para não-creators

## Fluxo de Uso

### 1. Acessar Painel Admin
1. Usuário com role `creator` navega para `/admin`
2. Link disponível na navbar (visível apenas para creators)

### 2. Buscar Usuário (Opcional)
1. Digite nickname ou ID no campo de busca
2. Clique em "Search"
3. Usuário aparece nos resultados
4. Clique em "Clear" para voltar à lista completa

### 3. Banir Usuário
1. Clique no botão "Ban" no card do usuário
2. No modal que abre:
   - Digite o motivo do banimento
   - Marque "Permanent Ban" OU especifique duração em minutos
   - Clique em "Ban User"
3. Confirmação visual após sucesso

### 4. Desbanir Usuário
1. Clique no botão "Unban" no card do usuário
2. Ação imediata (sem confirmação)
3. Status atualizado automaticamente

## Exemplos de Duração

- **1 hora**: 60 minutos
- **24 horas**: 1440 minutos
- **7 dias**: 10080 minutos
- **30 dias**: 43200 minutos
- **Permanente**: Marcar checkbox "Permanent Ban"

## Tratamento de Erros

### Erros de Formulário
- Motivo vazio: "Reason is required"
- Duração inválida: "Invalid duration"
- Exibidos em banner vermelho no modal

### Erros de API
- 404: Usuário não encontrado
- 403: Sem permissão ou tentativa de banir creator
- Exibidos inline nos componentes

### Detecção de Banimento (Usuário Final)
Quando um usuário banido tenta acessar o sistema:
1. Requisição retorna erro 403
2. `BanNotificationHandler` detecta o erro
3. Modal de "Account Banned" é exibido
4. Usuário é automaticamente deslogado
5. Não pode mais acessar o sistema até ser desbanido

## Integração com Backend

### Endpoints Utilizados

```typescript
POST /admin/ban-user
{
  userId: string
  reason: string
  durationMinutes?: number
}

POST /admin/unban-user
{
  userId: string
}
```

### Guards Aplicados
Todas as rotas protegidas têm o `BanGuard` no backend:
- `/queue/*` (HTTP e WebSocket)
- `/matches/*` (HTTP e WebSocket)

## Estilização

Utiliza o design system do projeto:
- **Cores**: Tema hextech com tons de ouro e cinza
- **Componentes**: Button, Dialog, Input, Label do sistema UI
- **Responsividade**: Mobile-first com breakpoints adequados
- **Animações**: Transições suaves nos hovers e estados

## Validações de Segurança

1. ✅ Apenas creators podem acessar `/admin`
2. ✅ Creators não podem ser banidos (botão desabilitado)
3. ✅ Bots não podem ser banidos (botão desabilitado)
4. ✅ Validação de dados no frontend antes de enviar
5. ✅ Queries invalidadas após ações para refresh automático
6. ✅ Loading states durante operações
7. ✅ Logout automático de usuários banidos

## Cache e Atualizações

Usa React Query para gerenciar cache:
- Queries invalidadas após ban/unban
- Refetch automático dos dados do usuário
- Estados de loading/error tratados

## Melhorias Futuras (Sugestões)

- [ ] Filtros avançados (por role, rating, etc)
- [ ] Paginação da lista de usuários
- [ ] Histórico de banimentos por usuário
- [ ] Modal de confirmação antes de banir
- [ ] Bulk actions (banir múltiplos usuários)
- [ ] Exportar lista de usuários banidos
- [ ] Estatísticas de banimentos
- [ ] Notificação toast ao invés de modal para unbans
- [ ] Preview de quanto tempo falta para ban expirar
- [ ] Ordenação customizável da lista
