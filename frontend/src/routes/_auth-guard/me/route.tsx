import { createFileRoute } from '@tanstack/react-router'
import { ProfileTemplate } from '@/components/templates'
import { useSession } from '@/contexts/auth-context'
import { useClientQuery } from '@/hooks/use-client-query'
import { apiClient } from '@/services/clients/api-client'

export const Route = createFileRoute('/_auth-guard/me')({
  component: () => {
    const user = useSession()

    const matchesQuery = useClientQuery(apiClient.match, 'listUserMatches', {
      userId: user!.uuid,
      limit: 20,
    })

    return 'temporarily disabled'

    // return <ProfileTemplate user={user!} matchesQuery={matchesQuery} />
  },
})
