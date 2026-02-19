import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { authClient } from '@/lib/auth-client'
import { ForbiddenError } from '@/services/clients/client-error'

export function BanNotificationHandler() {
  const [isBanned, setIsBanned] = useState(false)
  const [banMessage, setBanMessage] = useState<string | null>(null)

  useEffect(() => {
    // Listen for global errors
    const handleError = async (event: ErrorEvent) => {
      const error = event.error

      if (error instanceof ForbiddenError) {
        const errorDesc = await error.errorDescription
        const errorCode = await error.errorCode

        if (errorCode === 'forbidden' && errorDesc?.includes('banned')) {
          setIsBanned(true)
          setBanMessage(errorDesc || 'You have been banned from the platform.')

          // Sign out the user
          await authClient.signOut()
        }
      }
    }

    window.addEventListener('error', handleError)

    // Also listen for unhandled promise rejections
    const handleRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason

      if (error instanceof ForbiddenError) {
        const errorDesc = await error.errorDescription
        const errorCode = await error.errorCode

        if (errorCode === 'forbidden' && errorDesc?.includes('banned')) {
          setIsBanned(true)
          setBanMessage(errorDesc || 'You have been banned from the platform.')

          // Sign out the user
          await authClient.signOut()
        }
      }
    }

    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return (
    <Dialog open={isBanned} onOpenChange={() => {}}>
      <div className="bg-hextech-black/95 border-2 border-red-500 rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Account Banned</h2>
            <p className="text-grey-1 mb-6">{banMessage}</p>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-left">
            <p className="text-sm text-grey-1">
              If you believe this is a mistake, please contact support with your user ID.
            </p>
          </div>

          <p className="text-xs text-grey-1/70 mt-6">
            You will be signed out automatically.
          </p>
        </div>
      </div>
    </Dialog>
  )
}
