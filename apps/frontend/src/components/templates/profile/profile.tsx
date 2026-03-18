import { GetUserResult, Match } from '@magic3t/api-types'
import { UseQueryResult } from '@tanstack/react-query'
import { Panel } from '@/components/ui/panel'
import { useRegisterCommand } from '@/hooks/use-register-command'
import { Console } from '@/lib/console'
import { MatchHistory } from './components/match-history'
import { ProfileHeader } from './components/profile-header'
import { ProfileSearch } from './components/profile-search'
import { ProfileStats } from './components/profile-stats'

interface Props {
  user: GetUserResult
  matchesQuery: UseQueryResult<Match.ListMatchesResult, Error>
}

export function ProfileTemplate({ user, matchesQuery }: Props) {
  // Registers a console command to log the user ID
  useRegisterCommand(
    {
      name: 'userid',
      description: 'Logs the user ID',
      handler: async () => {
        Console.log(user.uuid)
        return 0
      },
    },
    [user.uuid]
  )

  return (
    <div className="min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Profile Card */}
        <Panel className="flex flex-col gap-4">
          <ProfileHeader user={user} />
          <ProfileStats user={user} />
          <ProfileSearch />
        </Panel>

        {/* Match History Card */}
        <Panel>
          <MatchHistory matchesQuery={matchesQuery} currentUserId={user.uuid} />
        </Panel>
      </div>
    </div>
  )
}
