import { League } from '@magic3t/common-types'
import { UserRole } from '@magic3t/database-types'
import { createFileRoute, Link } from '@tanstack/react-router'
import { GiCrown, GiRobotGrab } from 'react-icons/gi'
import { Panel } from '@/components/ui'
import { Tooltip } from '@/components/ui/tooltip'
import { useClientQuery } from '@/hooks/use-client-query'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'
import { divisionMap, leaguesMap } from '@/utils/ranks'
import { getIconUrl } from '@/utils/utils'

export const Route = createFileRoute('/leaderboard')({
  component: () => <LeaderboardTemplate />,
})

export function LeaderboardTemplate() {
  const query = useClientQuery(apiClient.user, 'getRanking', {
    authenticated: false,
  })

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl">
        <Panel className="flex-col">
          {/* Header */}
          <div className="text-center border-b-2 border-gold-5 pb-6 mb-6">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-gold-4 uppercase tracking-wide">
              Leaderboard
            </h1>
            <p className="text-grey-1 text-sm mt-2 uppercase tracking-wider">
              Top {query.data?.data.length} Magic3T Players
            </p>
          </div>

          {/* Ranking List */}
          {query.isSuccess && (
            <div className="space-y-2">
              {query.data.data.map((user, index) => {
                const isApex =
                  user.rating.league === League.Master || user.rating.league === League.Challenger
                const leagueInfo = leaguesMap[user.rating.league]
                const isTop1 = index === 0
                const isTopThree = index < 3
                const divisionString = user.rating.division ? divisionMap[user.rating.division] : ''

                return (
                  <Link
                    className={cn(
                      `group relative block rounded
                      bg-linear-to-r from-grey-3/40 to-grey-3/20
                      border-2 transition-all duration-300
                      hover:from-gold-5/20 hover:to-gold-5/10
                      font-serif
                      hover:border-gold-4/60 hover:shadow-lg hover:shadow-gold-5/20
                      border-gold-5/30`,
                      isTopThree && 'border-gold-4/50 from-gold-5/10 to-gold-5/5',
                      isTop1 &&
                        'border-gold-4 from-gold-4/40 to-gold-4/20 shadow-lg shadow-gold-5/30 hover:from-gold-4/30 hover:to-gold-4/10'
                    )}
                    from="/leaderboard"
                    to="/users/$nickname"
                    params={{ nickname: user.nickname?.replaceAll(' ', '') ?? '' }}
                    key={user.id}
                  >
                    <div className="flex items-center sm:gap-4 p-3 sm:p-5">
                      {/* Rank Number */}
                      {!isTop1 && (
                        <div
                          className={`
                        shrink-0 w-10 sm:w-12 text-center font-serif font-bold text-lg sm:text-xl
                        ${isTopThree ? 'text-gold-3' : 'text-grey-1'}
                      `}
                        >
                          #{index + 1}
                        </div>
                      )}

                      {/* Player Info */}
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 flex-nowrap">
                        <img
                          className="size-10 sm:size-12 rounded-full border-2 border-gold-5/50 group-hover:border-gold-4 transition-colors"
                          alt="icon"
                          src={getIconUrl(user.summonerIcon)}
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-nowrap">
                            {user.role === UserRole.Bot && (
                              <Tooltip text="Bot account">
                                <GiRobotGrab className="text-gold-4 size-6" />
                              </Tooltip>
                            )}
                            {user.role === UserRole.Creator && (
                              <Tooltip text="This account belongs to the creator of the game">
                                <GiCrown className="text-gold-4 size-6" />
                              </Tooltip>
                            )}
                            <span className="text-base sm:text-lg font-semibold text-gold-1 overflow-hidden overflow-ellipsis whitespace-nowrap">
                              {user.nickname ?? '?'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rank Badge */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Tooltip
                          text={`${leagueInfo.name} ${divisionString} - ${user.rating.points} LP`}
                        >
                          <img
                            className="w-8 sm:w-10 h-8 sm:h-10 drop-shadow-lg"
                            alt={leagueInfo.name}
                            title={leagueInfo.name}
                            src={leagueInfo.icon}
                          />
                        </Tooltip>
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-semibold text-gold-1">
                            {!isApex && divisionString}
                            {isApex && `${user.rating.points} LP`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top 3 Special Indicator */}
                    {isTopThree && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-linear-to-b from-gold-3 via-gold-4 to-gold-5 rounded-r" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
