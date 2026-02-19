import { GetUserResult, ListMatchesResult } from '@magic3t/api-types'
import { UserRole } from '@magic3t/database-types'
import { UseQueryResult } from '@tanstack/react-query'
import { GiHandcuffs } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { Panel } from '@/components/ui/panel'
import { AuthState, useAuth } from '@/contexts/auth-context'
import { useDialogStore } from '@/contexts/modal-store'
import { useRegisterCommand } from '@/hooks/use-register-command'
import { Console } from '@/lib/console'
import { BanModal } from './components/ban-modal'
import { MatchHistory } from './components/match-history'
import { ProfileHeader } from './components/profile-header'
import { ProfileSearch } from './components/profile-search'
import { ProfileStats } from './components/profile-stats'
import { UnbanModal } from './components/unban-modal'

interface Props {
  user: GetUserResult
  matchesQuery: UseQueryResult<ListMatchesResult, Error>
}

export function ProfileTemplate({ user, matchesQuery }: Props) {
  const { state, user: authUser } = useAuth()
  const showDialog = useDialogStore((s) => s.showDialog)

  const isCreator =
    state === AuthState.SignedIn && authUser?.role === UserRole.Creator

  const isSelf = state === AuthState.SignedIn && authUser?.id === user.id

  const isBanned =
    user.ban != null &&
    (user.ban.expiresAt === null || new Date(user.ban.expiresAt) > new Date())

  // Registers a console command to log the user ID
  useRegisterCommand(
    {
      name: 'userid',
      description: 'Logs the user ID',
      handler: async () => {
        Console.log(user.id)
        return 0
      },
    },
    [user.id]
  )

  return (
    <div className="min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Profile Card */}
        <Panel className="flex flex-col gap-4">
          <ProfileHeader user={user} />
          <ProfileStats user={user} />
          <ProfileSearch />

          {/* Creator ban/unban controls */}
          {isCreator && !isSelf && (
            <div className="flex justify-end pt-2 border-t border-gold-6/20">
              {isBanned ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => showDialog(<UnbanModal user={user} />)}
                >
                  <GiHandcuffs className="size-4" />
                  Desbanir
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => showDialog(<BanModal user={user} />)}
                >
                  <GiHandcuffs className="size-4" />
                  Banir
                </Button>
              )}
            </div>
          )}
        </Panel>

        {/* Match History Card */}
        <Panel>
          <MatchHistory matchesQuery={matchesQuery} currentUserId={user.id} />
        </Panel>
      </div>
    </div>
  )
}

