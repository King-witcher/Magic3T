import { GetUserResult, ListUsersResultData } from '@magic3t/api-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/services/clients/api-client'
import { BanUserDialog } from './ban-user-dialog'

interface UserManagementCardProps {
  user: GetUserResult | ListUsersResultData
}

export function UserManagementCard({ user }: UserManagementCardProps) {
  const [showBanDialog, setShowBanDialog] = useState(false)
  const queryClient = useQueryClient()

  const unbanMutation = useMutation({
    mutationFn: () => apiClient.admin.unbanUser(user.id),
    onSuccess: () => {
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['user-by-id', user.id] })
    },
  })

  const isCreator = user.role === 'creator'
  const isBot = user.role === 'bot'
  const hasStats = 'stats' in user

  return (
    <>
      <div className="bg-hextech-black/60 border-2 border-gold-6/30 rounded-lg p-4 hover:border-gold-5/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gold-1">{user.nickname}</h3>
              {isCreator && (
                <span className="px-2 py-0.5 bg-gold-6/30 border border-gold-5/50 rounded text-xs text-gold-1 font-semibold">
                  CREATOR
                </span>
              )}
              {isBot && (
                <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-500/50 rounded text-xs text-blue-200 font-semibold">
                  BOT
                </span>
              )}
            </div>
            <p className="text-sm text-grey-1/70">ID: {user.id}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-grey-1">
                Rating: <span className="text-gold-3 font-semibold">{user.rating.division}</span>
              </span>
              {hasStats && (
                <span className="text-grey-1">
                  W/L: <span className="text-gold-3">{user.stats.wins}</span>/
                  <span className="text-red-400">{user.stats.defeats}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!isCreator && !isBot && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBanDialog(true)}
                  disabled={unbanMutation.isPending}
                >
                  Ban
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => unbanMutation.mutate()}
                  disabled={unbanMutation.isPending}
                >
                  {unbanMutation.isPending ? 'Unbanning...' : 'Unban'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <BanUserDialog
        userId={user.id}
        userNickname={user.nickname}
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['user-by-id', user.id] })
        }}
      />
    </>
  )
}
