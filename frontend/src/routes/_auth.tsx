import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { Panel } from '@/components/atoms'
import { LoadingSessionTemplate } from '@/components/templates'
import { AuthState, useAuth } from '@/contexts/auth-context'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
  validateSearch,
})

function validateSearch(search: Record<string, unknown>): {
  referrer?: string
} {
  return {
    referrer: search.referrer?.toString(),
  }
}

function RouteComponent() {
  const { referrer } = Route.useSearch()
  const { state: authState } = useAuth()

  if (authState === AuthState.LoadingSession) {
    return <LoadingSessionTemplate />
  }

  // Redirects the user to the referrer or homepage if they're already signed in
  if (authState === AuthState.SignedIn) {
    return <Navigate to={referrer ?? '/'} replace />
  }

  // Redirects the user to choose-nickname if they're not registerd
  if (authState === AuthState.SignedInUnregistered) {
    return <Navigate to="/choose-nickname" search={referrer ? { referrer } : undefined} replace />
  }

  return (
    <div className="min-h-full w-full flex items-center justify-center p-8 lg:justify-start lg:px-[6vw]">
      <div className="w-full max-w-md flex-2">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <h1 className="font-serif font-bold text-5xl md:text-6xl text-gold-1 uppercase tracking-wider mb-2 drop-shadow-[0_0_20px_rgba(200,170,110,0.5)]">
            Magic3T
          </h1>
          <div className="h-0.5 w-32 mx-auto bg-linear-to-r from-transparent via-gold-3 to-transparent" />
        </div>

        {/* Main Form Container */}
        <Panel>
          <Outlet />
        </Panel>
      </div>
    </div>
  )
}
