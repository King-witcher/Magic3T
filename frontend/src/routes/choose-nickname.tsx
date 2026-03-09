import { createFileRoute, redirect } from '@tanstack/react-router'
import { ChooseNicknameTemplate } from '@/components/templates'
import { AuthState, useAuth } from '@/contexts/auth-context'

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
    await auth.registerWithGoogle(nickname)
    redirect({ to: referrer ?? '/tutorial' })
  }

  if (auth.state !== AuthState.SignedInUnregistered) {
    redirect({ to: '/sign-in', search: referrer ? { referrer } : undefined })
  }

  return <ChooseNicknameTemplate onChooseNickname={registerNickname} redirect={referrer} />
}
