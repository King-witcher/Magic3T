import { ReactNode } from 'react'
import { Button, Spinner } from '@/components/atoms'
import { useQueue } from '@/contexts/queue-context'
import { ServerStatus, useServiceStatus } from '@/contexts/service-status.context'
import { cn } from '@/lib/utils'
import { QueueMode } from '@/types/queue'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'unbeatable'

interface GameModeCardProps {
  mode: QueueMode
  title: string
  description: string
  icon: ReactNode
  difficulty?: Difficulty
  playersInQueue?: number
  variant?: 'bot' | 'pvp'
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'from-green-600/20 to-green-800/20 border-green-500/40',
  medium: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/40',
  hard: 'from-orange-600/20 to-orange-800/20 border-orange-500/40',
  unbeatable: 'from-red-600/20 to-red-800/20 border-red-500/40',
}

const difficultyBadgeColors: Record<Difficulty, string> = {
  easy: 'bg-green-500/20 text-green-300 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  hard: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  unbeatable: 'bg-red-500/20 text-red-300 border-red-500/50',
}

export function GameModeCard({
  mode,
  title,
  description,
  icon,
  difficulty,
  playersInQueue,
  variant = 'bot',
}: GameModeCardProps) {
  const { enqueue, dequeue, queueModes } = useQueue()
  const { serverStatus } = useServiceStatus()
  const isDisabled = serverStatus !== ServerStatus.On
  const isInQueue = !!queueModes[mode]

  const handleClick = () => {
    if (isInQueue) {
      dequeue(mode)
    } else {
      enqueue(mode)
    }
  }

  const bgGradient = difficulty
    ? difficultyColors[difficulty]
    : variant === 'pvp'
      ? 'from-blue-600/20 to-purple-800/20 border-blue-500/40'
      : 'from-grey-3/20 to-grey-2/20 border-gold-5/30'

  return (
    // biome-ignore lint/a11y/useSemanticElements: Button cannot be descendant of another button
    <div
      role="button"
      tabIndex={-1}
      className={cn(
        'relative group overflow-hidden border-2 transition-transform duration-200',
        'bg-linear-to-br backdrop-blur-md',
        'focus-within:outline-blue-2 focus-within:outline-3',
        bgGradient,
        isInQueue && 'ring-2 ring-gold-3 shadow-lg shadow-gold-3/30',
        !isDisabled && 'hover:scale-[1.02] cursor-pointer',
        isDisabled && 'opacity-50'
      )}
      onClick={!isDisabled ? handleClick : undefined}
    >
      {/* Animated background effect */}
      <div
        className={cn(
          'absolute inset-0 transition-transform -translate-x-full',
          'bg-linear-to-r from-transparent via-white/5 to-transparent duration-1000',
          'group-focus-within:translate-x-full group-hover:translate-x-full'
        )}
      />

      <div className="relative p-6 space-y-4">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'text-5xl transition-transform duration-300 group-hover:scale-110',
                isInQueue && 'animate-pulse'
              )}
            >
              {icon}
            </div>
            <div>
              <h3 className="font-serif font-bold text-2xl text-gold-1 uppercase tracking-wide">
                {title}
              </h3>
              {difficulty && (
                <span
                  className={cn(
                    'inline-block mt-1 px-2 py-0.5 text-xs font-semibold uppercase rounded border',
                    difficultyBadgeColors[difficulty]
                  )}
                >
                  {difficulty}
                </span>
              )}
            </div>
          </div>

          {/* Status indicator */}
          {isInQueue && (
            <div className="flex items-center gap-2 text-gold-3">
              <Spinner className="size-5" />
              <span className="text-sm font-semibold">Searching...</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-grey-1 text-sm leading-snug">{description}</p>

        {/* Players in queue (for PvP modes) */}
        {playersInQueue !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                playersInQueue > 0 ? 'bg-green-400 animate-pulse' : 'bg-grey-1'
              )}
            />
            <span className={playersInQueue > 0 ? 'text-green-400' : 'text-grey-1'}>
              {playersInQueue} {playersInQueue === 1 ? 'player' : 'players'} in queue
            </span>
          </div>
        )}

        {/* Action button */}
        <Button
          tabIndex={0}
          variant={isInQueue ? 'destructive' : 'primary'}
          size="md"
          disabled={isDisabled}
          type="button"
          className="w-full cursor-pointer"
        >
          {isInQueue ? 'Leave Queue' : 'Enter Queue'}
        </Button>
      </div>
    </div>
  )
}
