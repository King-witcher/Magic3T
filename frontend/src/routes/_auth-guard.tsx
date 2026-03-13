import { createFileRoute, Navigate, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LoadingSessionTemplate } from '@/components/templates'
import { AuthState, useAuth } from '@/contexts/auth/auth-context'

export const Route = createFileRoute('/_auth-guard')({
  component: () => {
    const auth = useAuth()
    const path = window.location.pathname

    const navigate = useNavigate()

    useEffect(() => {
      if (auth.state === AuthState.NotSignedIn || auth.state === AuthState.SignedInUnregistered)
        navigate({
          to: '/sign-in',
          search:
            path === '/'
              ? undefined
              : {
                  referrer: path,
                },
        })
    }, [auth.state, navigate, path])

    if (auth.state === AuthState.LoadingSession) {
      return <LoadingSessionTemplate />
    }

    if (auth.state === AuthState.NotSignedIn || auth.state === AuthState.SignedInUnregistered) {
      return <Navigate to="/sign-in" search={path === '/' ? undefined : { referrer: path }} />
    }

    return <Outlet />
  },
})
