import { createFileRoute } from '@tanstack/react-router'
import { ProfileTemplate } from '@/components/templates'
import { useUser } from '@/contexts/auth-context'
import { useClientQuery } from '@/hooks/use-client-query'
import { apiClient } from '@/services/clients/api-client'

export const Route = createFileRoute('/_auth-guarded/me')({
  component: () => {
    const user = useUser()

    const matchesQuery = useClientQuery(apiClient.match, 'listUserMatches', {
      userId: user!.id,
      limit: 20,
    })

    return <ProfileTemplate user={user!} matchesQuery={matchesQuery} />
  },
})
