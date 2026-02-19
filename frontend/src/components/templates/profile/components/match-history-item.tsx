import { ListMatchesResultItem } from '@magic3t/api-types'
import { Team } from '@magic3t/common-types'
import { useState } from 'react'
import { MatchDetailModal } from '@/components/organisms/match-detail'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { leaguesMap } from '@/utils/ranks'
import { AvatarImage, AvatarRoot, AvatarWing } from './profile-avatar'

interface MatchHistoryItemProps {
  match: ListMatchesResultItem
  currentUserId: string
}

type MatchResult = 'victory' | 'defeat' | 'draw'

const DIVISIONS = ['I', 'II', 'III', 'IV', 'V']

export function MatchHistoryItem({ match, currentUserId }: MatchHistoryItemProps) {
  // Determine which side the current user played on
  const isOrder = match.order.uid === currentUserId
  const currentPlayer = isOrder ? match.order : match.chaos
  const opponent = isOrder ? match.chaos : match.order

  // Determine match result for the current user
  const getResult = (): MatchResult => {
    if (match.winner === null) return 'draw'
    const userTeam = isOrder ? Team.Order : Team.Chaos
    return match.winner === userTeam ? 'victory' : 'defeat'
  }

  const result = getResult()
  const opponentLeagueInfo = leaguesMap[opponent.league]

  // Format date
  const matchDate = new Date(match.date)
  const formattedDate = matchDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: matchDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
  const formattedTime = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // LP change styling
  const lpGain = currentPlayer.lp_gain
  const lpColor = lpGain > 0 ? 'text-green-400' : lpGain < 0 ? 'text-red-400' : 'text-grey-1'
  const lpPrefix = lpGain > 0 ? '+' : ''

  const resultConfig = {
    victory: {
      bg: 'from-green-900/30 to-green-900/10',
      border: 'border-green-600/40 hover:border-green-500/60',
      text: 'Victory',
      textColor: 'text-green-400',
    },
    defeat: {
      bg: 'from-red-900/30 to-red-900/10',
      border: 'border-red-600/40 hover:border-red-500/60',
      text: 'Defeat',
      textColor: 'text-red-400',
    },
    draw: {
      bg: 'from-grey-2/30 to-grey-2/10',
      border: 'border-grey-1/40 hover:border-grey-1/60',
      text: 'Draw',
      textColor: 'text-grey-1',
    },
  }

  const config = resultConfig[result]
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          'group block rounded transition-all duration-300 w-full text-left cursor-pointer',
          'bg-linear-to-r',
          config.bg,
          'border',
          config.border,
          'hover:shadow-lg hover:shadow-black/20'
        )}
      >
        <div className="flex items-center gap-3 py-3 px-4 sm:py-4 sm:px-5">
          {/* Match Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Opponent Icon */}
              <AvatarRoot className="size-8">
                <AvatarImage icon={29} />
                <AvatarWing league={opponent.league} />
              </AvatarRoot>

              {/* Opponent Name */}
              <div className="min-w-0">
                <span className="text-gold-1 font-bold font-serif truncate block">
                  {opponent.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-grey-1">
                  <Tooltip text={opponentLeagueInfo.name}>
                    <img src={opponentLeagueInfo.icon} alt="" className="size-4" />
                  </Tooltip>
                  <span className="font-serif">
                    {opponentLeagueInfo.name}{' '}
                    {opponent.division ? DIVISIONS[opponent.division - 1] : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Result & LP */}
          <div className="shrink-0 text-right">
            <div
              className={cn(
                'font-serif font-bold uppercase flex items-center gap-1',
                config.textColor
              )}
            >
              {config.text}
              {result === 'draw' && (
                <span className="text-sm font-sans font-medium">
                  ({currentPlayer.score > 0.5 && '+'}
                  {Math.round(currentPlayer.score * 200 - 100)})
                </span>
              )}
            </div>
            {lpGain !== 0 && (
              <div className={cn('text-sm font-semibold', lpColor)}>
                {lpPrefix}
                {lpGain} LP
              </div>
            )}
          </div>

          {/* Date */}
          <div className="hidden sm:block shrink-0 text-right text-grey-1 text-sm w-16">
            <div>{formattedDate}</div>
            <div className="text-xs opacity-70">{formattedTime}</div>
          </div>
        </div>
      </button>
      <MatchDetailModal match={match} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
