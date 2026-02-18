import { Panel, Spinner } from '@/components/atoms'
import { AuthState, useAuth } from '@/contexts/auth-context'

const STATUS_MAP: Record<AuthState, string> = {
  [AuthState.LoadingSession]: 'Loading session',
  [AuthState.LoadingUserData]: 'Loading user',
  [AuthState.NotSignedIn]: 'This message should never be seen. Please report a bug.',
  [AuthState.SignedInUnregistered]: 'This message should never be seen. Please report a bug.',
  [AuthState.SignedIn]: 'This message should never be seen. Please report a bug.',
}

export function LoadingSessionTemplate() {
  const { state } = useAuth()

  return (
    <div className="center h-full flex-col px-4">
      <Panel className="flex flex-col items-center gap-2 w-120 max-w-full">
        <h1 className="text-3xl text-gold-4 font-bold font-serif mt-3 uppercase">
          {STATUS_MAP[state]}
        </h1>
        <p className="text-grey-1 text-center">If nothing shows up shortly, refresh the page.</p>
        <Spinner className="size-[50px] mt-2" />
      </Panel>
    </div>
  )
}
