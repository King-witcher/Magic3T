import { GetMatchResult } from '@magic3t/api-types'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/atoms'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/services/clients/api-client'
import { MatchDetail } from './match-detail'

interface MatchDetailModalProps {
  /** Pass a match ID to fetch, or pass the full match data directly. */
  match: string | GetMatchResult
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchDetailModal({ match, open, onOpenChange }: MatchDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <div className="sm:max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            {/* <DialogTitle>Match Details</DialogTitle> */}
            <DialogDescription className="sr-only">
              Detailed view of a match between two players
            </DialogDescription>
          </DialogHeader>
          {typeof match === 'string' ? (
            <MatchDetailFetcher matchId={match} />
          ) : (
            <MatchDetail match={match} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MatchDetailFetcher({ matchId }: { matchId: string }) {
  const matchQuery = useQuery({
    queryKey: ['match', matchId],
    async queryFn() {
      return apiClient.match.getById(matchId)
    },
  })

  if (matchQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8" />
        <span className="ml-3 text-grey-1">Loading match...</span>
      </div>
    )
  }

  if (matchQuery.isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load match details</p>
        <p className="text-grey-1 text-sm mt-1">{matchQuery.error.message}</p>
      </div>
    )
  }

  return <MatchDetail match={matchQuery.data} />
}
