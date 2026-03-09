import { ClientSessionData } from '@magic3t/api-types'
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import z from 'zod'
import { useRegisterCommand } from '@/hooks/use-register-command'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Console } from '@/lib/console'
import { firebaseClient } from '@/lib/firebase-client'
import { apiClient } from '@/services/clients/api-client'
import { ClientError } from '@/services/clients/client-error'

export enum AuthState {
  /** The authentication session is being loaded */
  LoadingSession = 'loading-session',
  /** The user is not signed in */
  NotSignedIn = 'not-signed-in',
  /** Means that the user is signed in but has not completed the registration process (e.g., choosing a nickname). */
  SignedInUnregistered = 'unregistered',
  /** The user is signed in and user data has been loaded */
  SignedIn = 'signed-in',
}

export const AUTH_SESSION_STORAGE_KEY = 'auth-session'

type AuthContextData =
  | {
      session: null
      uuid: null
      signedIn: false
      state: AuthState.NotSignedIn
      signInWithGoogle: () => Promise<void>
    }
  | {
      session: null
      uuid: null
      signedIn: false
      state: AuthState.LoadingSession
    }
  | {
      session: null
      uuid: null
      signedIn: false
      state: AuthState.SignedInUnregistered
      registerWithGoogle: (nickname: string) => Promise<void>
    }
  | {
      session: ClientSessionData
      uuid: string
      signedIn: true
      state: AuthState.SignedIn
      signOut: () => Promise<void>
    }

interface Props {
  children?: ReactNode
}

export const AuthContext = createContext<AuthContextData | null>(null)

export function AuthProvider({ children }: Props) {
  const [sessionId, setSessionId] = useLocalStorage(
    AUTH_SESSION_STORAGE_KEY,
    null,
    z.string().nullable()
  )
  // If session id is undefined, we don't even have to check anything else.
  const [loadingInitSession, setLoadingInitSession] = useState(sessionId !== null)
  const [shouldRegister, setShouldRegister] = useState(false)

  const [sessionData, setSessionData] = useState<ClientSessionData | null>(null)

  const firebaseId = useSyncExternalStore(
    (sub) => firebaseClient.onAuthStateChanged(sub),
    () => firebaseClient.userId ?? null
  )

  useEffect(function loadInitialState() {
    async function loadSession() {
      firebaseClient.signOut()
      if (sessionId) {
        Console.log('Validating session token...')
        try {
          const response = await apiClient.auth.validateSession()
          setSessionData(response)
        } catch (e) {
          setSessionId(null)
          setSessionData(null)
          Console.log('Failed to validate session token.')
          console.error(e)
        } finally {
          setLoadingInitSession(false)
        }
      } else {
        Console.log('No session detected.')
        // Ensure we are signed out of Firebase if there's no session, to avoid confusion.
        firebaseClient.signOut()
      }
    }
    loadSession()
  }, [])

  async function signInFirebase() {
    try {
      await firebaseClient.signInWithGoogle()
      const token = await firebaseClient.token
      if (!token) throw new Error('Failed to obtain Firebase token after sign-in')
      const data = await apiClient.auth.signInFirebase({ token })
      if (data.status === 'registered') {
        // If user is registered, sign out from Firebase.
        setSessionData(data.sessionData)
        setSessionId(data.sessionId)
        firebaseClient.signOut()
      } else {
        // Otherwise, Firebase session is needed for registration.
        setShouldRegister(true)
        setSessionData(null)
        setSessionId(null)
      }
    } catch (error) {
      setSessionData(null)
      setSessionId(null)
      await firebaseClient.signOut()
      Console.log((error as Error).message)
      console.error(error)
    }
  }

  async function registerFirebase(nickname: string) {
    try {
      const token = await firebaseClient.token
      if (!token) throw new Error('Failed to obtain Firebase token for registration')
      const response = await apiClient.auth.registerFirebase({
        data: { nickname },
        token,
      })
      setSessionData(response.sessionData)
      setSessionId(response.sessionId)
      setShouldRegister(false)
      firebaseClient.signOut()
    } catch (error) {
      if (error instanceof ClientError && (await error.errorCode) === 'NicknameUnavailable') {
        throw new Error('Nickname is already taken. Please choose another one.')
      }
    }
  }

  useRegisterCommand(
    {
      description: 'Generate and print your Firebase authentication token',
      name: 'firebase-token',
      async handler(ctx) {
        if (!firebaseId) {
          ctx.console.print('You are not signed in on firebase')
          return 1
        }

        ctx.console.print('Generating token')
        const token = await firebaseClient.token
        ctx.console.print(token ?? 'null')
        return 0
      },
    },
    [firebaseId]
  )

  useRegisterCommand(
    {
      description: 'Prints your Session ID',
      name: 'showsid',
      async handler(ctx) {
        if (!sessionId) {
          ctx.console.print('You are not signed in')
          return 1
        }
        ctx.console.print(sessionId ?? 'null')
        if (sessionId) {
          ctx.console.print('Session ID copied to clipboard')
        }
        return 0
      },
    },
    [sessionId]
  )

  const contextData = useMemo<AuthContextData>((): AuthContextData => {
    if (loadingInitSession) {
      return {
        session: null,
        uuid: null,
        signedIn: false,
        state: AuthState.LoadingSession,
      }
    }

    if (shouldRegister) {
      return {
        session: null,
        uuid: null,
        signedIn: false,
        state: AuthState.SignedInUnregistered,
        registerWithGoogle: registerFirebase,
      }
    }

    if (!sessionData) {
      return {
        session: null,
        uuid: null,
        signedIn: false,
        state: AuthState.NotSignedIn,
        signInWithGoogle: signInFirebase,
      }
    }

    return {
      session: sessionData,
      uuid: sessionData.uuid,
      signedIn: true,
      state: AuthState.SignedIn,
      signOut: async () => {},
    }
  }, [loadingInitSession, sessionData, shouldRegister])

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

export function useSession(): ClientSessionData | null {
  const auth = useAuth()
  return auth.session
}
