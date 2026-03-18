import { useMemo } from 'react'
import { GiCrown, GiScales, GiSwordsPower } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { useGame } from '@/contexts/game-context'
import { cn } from '@/lib/utils'

const config = {
  victory: {
    title: 'VICTORY',
    icon: GiCrown,
    gradient: 'from-gold-5/30 via-gold-6/20 to-gold-5/30',
    border: 'border-gold-4',
    titleColor: 'text-gold-1',
    iconColor: 'text-gold-3',
    glow: 'shadow-gold-3/50',
  },
  defeat: {
    title: 'DEFEAT',
    icon: GiSwordsPower,
    gradient: 'from-red-900/30 via-red-800/20 to-red-900/30',
    border: 'border-red-500',
    titleColor: 'text-red-400',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/50',
  },
  draw: {
    title: 'DRAW',
    icon: GiScales,
    gradient: 'from-grey-3/30 via-grey-2/20 to-grey-3/30',
    border: 'border-grey-1',
    titleColor: 'text-grey-1',
    iconColor: 'text-grey-1',
    glow: 'shadow-grey-1/30',
  },
}

export function GameResultModal() {
  const game = useGame()

  const result = useMemo(() => {
    if (game.currentTeam === null || !game.finalReport) return null

    const winner = game.finalReport.winner
    if (winner === game.currentTeam) return 'victory'
    if (winner === null) return 'draw'
    return 'defeat'
  }, [game.currentTeam, game.finalReport])

  const lpGain = useMemo(() => {
    if (game.currentTeam === null || !game.finalReport) return 0
    return Math.round(game.finalReport[game.currentTeam].lpGain || 0)
  }, [game.currentTeam, game.finalReport])

  const score = useMemo(() => {
    if (game.currentTeam === null || !game.finalReport) return 0
    const rawScore = 2 * game.finalReport[game.currentTeam].score - 1
    return Math.round(rawScore * 100)
  }, [game.currentTeam, game.finalReport])

  if (!result) return null

  const c = config[result]
  const Icon = c.icon

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-6 p-8 min-w-100 max-w-lg',
        'border-2',
        'bg-linear-to-b',
        c.gradient,
        c.border,
        'backdrop-blur-xl',
        'shadow-2xl',
        c.glow
      )}
    >
      {/* Decorative corners */}
      <div className={cn('absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2', c.border)} />
      <div className={cn('absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2', c.border)} />
      <div className={cn('absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2', c.border)} />
      <div className={cn('absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2', c.border)} />

      {/* Icon */}
      <div className={cn('relative', c.iconColor)}>
        <Icon size={80} className="drop-shadow-lg" />
        {result === 'victory' && (
          <div className="absolute inset-0 animate-pulse opacity-50">
            <Icon size={80} />
          </div>
        )}
      </div>

      {/* Title */}
      <h2
        className={cn(
          'font-serif font-bold text-5xl uppercase tracking-[0.2em]',
          c.titleColor,
          result === 'victory' && 'drop-shadow-[0_0_20px_rgba(200,170,110,0.5)]'
        )}
      >
        {c.title}
      </h2>

      {/* Stats */}
      <div className="flex items-center justify-center gap-8 w-full border-t border-b border-gold-4/30 py-4">
        <div className="text-center">
          <p className="text-grey-1 text-xs uppercase tracking-wider mb-1">Match Score</p>
          <p className="font-serif font-bold text-2xl text-gold-2">{score}</p>
        </div>
        <div className="w-px h-12 bg-gold-4/30" />
        <div className="text-center">
          <p className="text-grey-1 text-xs uppercase tracking-wider mb-1">LP Change</p>
          <p
            className={cn(
              'font-serif font-bold text-2xl',
              lpGain > 0 && 'text-green-400',
              lpGain < 0 && 'text-red-400',
              lpGain === 0 && 'text-grey-1'
            )}
          >
            {lpGain >= 0 ? '+' : ''}
            {lpGain}
          </p>
        </div>
      </div>

      {/* Actions */}
      <Button variant="secondary" size="lg" onClick={game.disconnect} className="w-full">
        Leave Room
      </Button>
    </div>
  )
}
