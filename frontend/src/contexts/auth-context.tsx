import { GetUserResult } from '@magic3t/api-types'
import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useRegisterCommand } from '@/hooks/use-register-command'
import { authClient } from '@/lib/auth-client'
import { Console } from '@/lib/console'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'

export enum AuthState {
  /** The authentication session is being loaded */
  LoadingSession = 'loading-session',
  /** The user is not signed in */
  NotSignedIn = 'not-signed-in',
  /** The user is signed in but the user data is still being loaded */
  LoadingUserData = 'loading-user-data',
  /** Means that the user is signed in but has not completed the registration process (e.g., choosing a nickname). */
  SignedInUnregistered = 'unregistered',
  /** The user is signed in and user data has been loaded */
  SignedIn = 'signed-in',
}

type AuthContextData =
  | {
      user: null
      userId: null
      signedIn: false
      state: AuthState.NotSignedIn | AuthState.LoadingSession
    }
  | {
      user: null
      userId: string
      signedIn: false
      state: AuthState.LoadingUserData
    }
  | {
      user: null
      userId: string
      signedIn: true
      state: AuthState.SignedInUnregistered
      refetchUser: () => Promise<void>
    }
  | {
      user: GetUserResult
      userId: string
      signedIn: true
      state: AuthState.SignedIn
      refetchUser: () => Promise<void>
    }

interface Props {
  children?: ReactNode
}

const AuthContext = createContext<AuthContextData | null>(null)

export function AuthProvider({ children }: Props) {
  // This state is only true while we're waiting for the initial auth state to load
  const [loadingSession, setLoadingSession] = useState(true)
  useEffect(() => {
    Console.log('Loading session...')
    const unlisten = authClient.onAuthStateChanged(firstListener)
    function firstListener(userId: string | null) {
      Console.log(`Session loaded: ${userId ? `signed in as ${userId}` : 'Not signed in'}`)
      setLoadingSession(false)
      unlisten()
    }
  }, [])

  const userId = useSyncExternalStore(
    (sub) => authClient.onAuthStateChanged(sub),
    () => authClient.userId ?? null
  )

  const userQuery = useQuery({
    queryKey: ['user-by-id', userId],
    enabled: !!userId,
    queryFn: async () => {
      Console.log('Loading user...')
      if (!userId) throw new Error('No user ID')
      return apiClient.user.getById(userId)
    },
  })

  useRegisterCommand(
    {
      description: 'Generate and print your authentication token',
      name: 'gentoken',
      async handler(ctx) {
        if (!userId) {
          ctx.console.print('You are not signed in')
          return 1
        }

        ctx.console.print('Generating token')
        const token = await authClient.token
        ctx.console.print(token ?? 'null')
        return 0
      },
    },
    [userId]
  )

  const contextData = useMemo<AuthContextData>((): AuthContextData => {
    if (loadingSession) {
      return { user: null, userId: null, signedIn: false, state: AuthState.LoadingSession }
    }
    if (!userId) {
      return { user: null, userId: null, signedIn: false, state: AuthState.NotSignedIn }
    }
    switch (userQuery.status) {
      case 'pending':
        return { user: null, userId, signedIn: false, state: AuthState.LoadingUserData }
      case 'error':
        // User not found (unregistered)
        if (userQuery.error instanceof NotFoundError) {
          return {
            user: null,
            userId,
            signedIn: true,
            state: AuthState.SignedInUnregistered,
            refetchUser: async () => {
              await userQuery.refetch()
            },
          }
        }
        // Unexpected error
        console.error('Error loading user data:', userQuery.error)
        return { user: null, userId: null, signedIn: false, state: AuthState.NotSignedIn }
      case 'success':
        return {
          user: userQuery.data,
          userId,
          signedIn: true,
          state: AuthState.SignedIn,
          refetchUser: async () => {
            await userQuery.refetch()
          },
        }
    }
  }, [loadingSession, userId, userQuery.status, userQuery.data, userQuery.error, userQuery.refetch])

  return <AuthContext value={contextData}>{children}</AuthContext>
}

export function useAuth(): AuthContextData {
  const authData = use(AuthContext)
  if (authData === null) throw new Error('Used auth context outside <AuthProvider>')
  return authData
}

export function useSignedAuth(): Exclude<AuthContextData, { signedIn: false }> {
  const auth = useAuth()
  if (!auth.signedIn) throw new Error('User is not signed in')
  return auth
}

export function useUser(): GetUserResult | null {
  const auth = useAuth()
  return auth.user
}
