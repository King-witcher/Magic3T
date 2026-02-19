import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { MatchDetail } from '@/components/organisms/match-detail'
import { Loading, NotFoundTemplate } from '@/components/templates'
import { Panel } from '@/components/ui/panel'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'

export const Route = createFileRoute('/matches/$match')({
  component: RouteComponent,
})

function RouteComponent() {
  const { match: matchId } = Route.useParams()

  const matchQuery = useQuery({
    queryKey: ['match', matchId],
    async queryFn() {
      return apiClient.match.getById(matchId)
    },
  })

  switch (matchQuery.status) {
    case 'pending':
      return <Loading />
    case 'error':
      if (matchQuery.error instanceof NotFoundError) {
        return <NotFoundTemplate />
      }
      return <div>Error: {matchQuery.error.message}</div>
    case 'success':
      return (
        <div className="min-h-full p-4 sm:p-8 flex justify-center items-start">
          <div className="w-full max-w-2xl">
            <Panel>
              <MatchDetail match={matchQuery.data} />
            </Panel>
          </div>
        </div>
      )
  }
}
