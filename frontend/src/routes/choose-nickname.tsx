import { createFileRoute, Navigate, redirect } from '@tanstack/react-router'
import { ChooseNicknameTemplate } from '@/components/templates'
import { AuthState, useAuth } from '@/contexts/auth/auth-context'

export const Route = createFileRoute('/choose-nickname')({
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
  const auth = useAuth()
  const { referrer } = Route.useSearch()

  async function registerNickname(nickname: string) {
    if (auth.state !== AuthState.SignedInUnregistered) return
    await auth.registerFromFirebase(nickname)
    redirect({ to: referrer ?? '/tutorial' })
  }

  if (auth.state !== AuthState.SignedInUnregistered) {
    return <Navigate to={referrer ?? '/sign-in'} />
  }

  return <ChooseNicknameTemplate onChooseNickname={registerNickname} redirect={referrer} />
}
