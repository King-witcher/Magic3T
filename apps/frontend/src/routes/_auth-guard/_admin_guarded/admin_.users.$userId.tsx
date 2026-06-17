import { createFileRoute } from '@tanstack/react-router'
import { Loading, NotFoundTemplate } from '@/components/templates'
import { AdminUserEditTemplate } from '@/components/templates/admin'
import { useClientQuery } from '@/hooks/use-client-query'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'

export const Route = createFileRoute('/_auth-guard/_admin_guarded/admin_/users/$userId')({
  component: Page,
})

function Page() {
  const { userId } = Route.useParams()
  const query = useClientQuery(apiClient.admin, 'getUser', userId)

  switch (query.status) {
    case 'pending':
      return <Loading />
    case 'error':
      if (query.error instanceof NotFoundError) return <NotFoundTemplate />
      return <div className="p-8 text-red-300 font-serif">Erro: {query.error.message}</div>
    case 'success':
      return (
        <AdminUserEditTemplate
          key={query.data.id}
          user={query.data}
          onSaved={(updated) => query.setData(updated)}
        />
      )
  }
}
