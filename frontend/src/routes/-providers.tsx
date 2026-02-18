import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { GameProvider } from '@/contexts/game-context'
import { LiveActivityProvider } from '@/contexts/live-activity.context'
import { QueueProvider } from '@/contexts/queue-context'
import { ServiceStatusProvider } from '@/contexts/service-status.context'
import { ClientError, InternalServerError, RateLimitError } from '@/services/clients/client-error'

interface Props {
  children: ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        // Retry up to 3 times for other errors
        if (failureCount >= 3) return false

        // Retry for specific server errors
        if (error instanceof InternalServerError) return true
        if (error instanceof RateLimitError) return true
        if (!(error instanceof ClientError)) return true

        return false
      },
    },
  },
})

export function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveActivityProvider>
        <ServiceStatusProvider>
          <AuthProvider>
            <GameProvider>
              <QueueProvider>{children}</QueueProvider>
            </GameProvider>
          </AuthProvider>
        </ServiceStatusProvider>
      </LiveActivityProvider>
    </QueryClientProvider>
  )
}
