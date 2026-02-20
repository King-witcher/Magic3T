import type { GetUserResult } from '@magic3t/api-types'
import { Link } from '@tanstack/react-router'
import { Flag } from 'lucide-react'
import { SmoothNumber, TimerValue } from '@/components/atoms'
import { Tooltip } from '@/components/ui/tooltip'
import type { Timer } from '@/lib/Timer'
import { cn } from '@/lib/utils'
import { divisionMap, leaguesMap } from '@/utils/ranks'
import { AvatarImage, AvatarRoot } from '../../profile/components/profile-avatar'

interface PlayerPanelProps {
  profile: GetUserResult | null
  timer: Timer
  isPaused: boolean
  isActive: boolean
  position: 'top' | 'bottom'
  lpGain?: number | null
  showSurrender?: boolean
  onSurrender?: () => void
}

export function PlayerPanel({
  profile,
  timer,
  isPaused,
  isActive,
  position,
  lpGain,
  showSurrender,
  onSurrender,
}: PlayerPanelProps) {
  const tierInfo = profile ? leaguesMap[profile.rating.league] : null
  const isBot = profile?.role === 'bot'

  return (
    <div
      className={cn(
        'relative w-full max-w-md',
        'backdrop-blur-md rounded-lg',
        'border-2 transition-all duration-300 overflow-hidden',
        isActive
          ? position === 'bottom'
            ? 'bg-linear-to-r from-blue-900/40 to-blue-800/40 border-blue-400/50 shadow-lg shadow-blue-500/20'
            : 'bg-linear-to-r from-red-900/40 to-red-800/40 border-red-400/50 shadow-lg shadow-red-500/20'
          : 'bg-grey-3/60 border-gold-5/30'
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <Link
          to="/users/id/$userId"
          params={{ userId: profile?.id || '' }}
          className="shrink-0 transition-transform hover:scale-105 border-3 border-gold-7 rounded-full"
        >
          <AvatarRoot className="size-16">
            <AvatarImage icon={profile?.summonerIcon || 0} />
          </AvatarRoot>
        </Link>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isBot && (
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-gold-6/30 text-gold-3 border border-gold-5/50">
                Bot
              </span>
            )}
            <h3 className="font-serif font-bold text-lg text-gold-1 truncate">
              {profile?.nickname || 'Unknown'}
            </h3>
          </div>

          {/* Rank info */}
          {tierInfo && (
            <div className="flex items-center gap-2 text-sm">
              <img alt="rank" className="w-5 h-5" src={tierInfo.icon} />
              <span className="text-grey-1 capitalize">
                {profile?.rating.league} {divisionMap[profile?.rating.division || 0]}
              </span>
              {profile?.rating.points !== null && (
                <span className="text-grey-1">
                  • <SmoothNumber value={profile?.rating.points || 0} /> LP
                </span>
              )}
            </div>
          )}

          {/* LP Gain/Loss display */}
          {lpGain !== null && lpGain !== undefined && (
            <div
              className={cn(
                'mt-1 text-sm font-bold',
                lpGain > 0 && 'text-green-600',
                lpGain < 0 && 'text-red-700',
                lpGain === 0 && 'text-grey-1'
              )}
            >
              {lpGain >= 0 ? '+' : ''}
              {Math.round(lpGain)} LP
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="shrink-0">
          <div
            className={cn(
              'relative flex items-center gap-1 px-4 py-2 rounded-lg',
              showSurrender && position === 'bottom' ? 'pr-2' : 'pr-4',
              'border-2 transition-all duration-300',
              'bg-hextech-black/60',
              isActive ? 'border-gold-4/70 shadow-md shadow-gold-5/20' : 'border-grey-1/30'
            )}
          >
            <div
              className={cn(
                'font-mono text-2xl font-bold tracking-wider',
                isActive ? 'text-gold-1' : 'text-grey-1'
              )}
            >
              <TimerValue timer={timer} pause={isPaused} />
            </div>
            {showSurrender && position === 'bottom' && (
              <Tooltip text="Surrender">
                <button
                  type="button"
                  onClick={onSurrender}
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200',
                    'text-red-400 hover:text-red-300',
                    'hover:bg-red-500/20',
                    'border border-transparent hover:border-red-500/50'
                  )}
                >
                  <Flag size={20} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Active turn indicator bar */}
      {isActive && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-1',
            position === 'bottom' ? 'bg-blue-400' : 'bg-red-400',
            'animate-pulse'
          )}
        />
      )}
    </div>
  )
}
