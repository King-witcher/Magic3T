import { createFileRoute } from '@tanstack/react-router'
import { Loading, NotFoundTemplate } from '@/components/templates'
import { ProfileTemplate } from '@/components/templates/profile/profile'
import { useSignedAuth } from '@/contexts/auth/auth-context'
import { useClientQuery } from '@/hooks/use-client-query'
import { NotFoundError } from '@/services/clients'
import { apiClient } from '@/services/clients/api-client'

export const Route = createFileRoute('/_auth-guard/me')({
  component: () => {
    const auth = useSignedAuth()

    const userQuery = useClientQuery(apiClient.user, 'getById', auth.uuid)

    const matchesQuery = useClientQuery(apiClient.match, 'listUserMatches', {
      userId: auth.uuid,
      limit: 20,
    })

    switch (userQuery.status) {
      case 'pending': {
        return <Loading />
      }
      case 'error': {
        if (userQuery.error instanceof NotFoundError) {
          return <NotFoundTemplate />
        }
        return (
          <div className="flex items-center justify-center">
            <p className="text-red-500">Error: {userQuery.error.message}</p>
          </div>
        )
      }
      case 'success': {
        if (!userQuery.data) {
          return <div>User not found</div>
        }
        return <ProfileTemplate matchesQuery={matchesQuery} user={userQuery.data} />
      }
    }
  },
})
