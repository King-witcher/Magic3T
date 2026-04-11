import { createFileRoute } from '@tanstack/react-router'
import { Loading, NotFoundTemplate, ProfileTemplate } from '@/components/templates'
import { useClientQuery } from '@/hooks/use-client-query'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'

export const Route = createFileRoute('/users/id/$userId')({
  component: Page,
  shouldReload: false,
})

function Page() {
  const { userId } = Route.useParams()

  const userQuery = useClientQuery(apiClient.user, 'getById', userId)

  const matchesQuery = useClientQuery(
    apiClient.match,
    'listUserMatches',
    {
      limit: 20,
      userId: userQuery.data?.id ?? '',
    },
    {
      staleTime: Number.POSITIVE_INFINITY,
      enabled: !!userQuery.data,
    }
  )
  switch (userQuery.status) {
    case 'pending': {
      return <Loading />
    }
    case 'error': {
      if (userQuery.error instanceof NotFoundError) {
        return <NotFoundTemplate />
      }
      return <div>Error: {userQuery.error.message}</div>
    }
    case 'success': {
      if (!userQuery.data) {
        return <NotFoundTemplate />
      }
      return <ProfileTemplate matchesQuery={matchesQuery} user={userQuery.data} />
    }
  }
}
