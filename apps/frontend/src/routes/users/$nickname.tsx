import { createFileRoute } from '@tanstack/react-router'
import { Loading, NotFoundTemplate, ProfileTemplate } from '@/components/templates'
import { useClientQuery } from '@/hooks/use-client-query'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'

export const Route = createFileRoute('/users/$nickname')({
  component: RouteComponent,
  shouldReload: false,
})

function RouteComponent() {
  const { nickname } = Route.useParams()
  const slug = nickname.toLowerCase().replaceAll(' ', '')

  const userQuery = useClientQuery(apiClient.user, 'getByNickname', slug, { authenticated: false })
  const matchesQuery = useClientQuery(
    apiClient.match,
    'listUserMatches',
    {
      limit: 20,
      userId: userQuery.data?.uuid ?? '',
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
