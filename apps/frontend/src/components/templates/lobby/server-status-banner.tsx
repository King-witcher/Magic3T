import { cn } from '@/lib/utils'

interface ServerStatusBannerProps {
  status: 'on' | 'loading' | 'off'
  playersOnline: number
}

export function ServerStatusBanner({ status, playersOnline }: ServerStatusBannerProps) {
  const statusConfig = {
    on: {
      bg: 'from-green-900/40 to-green-950/40 border-green-500/30',
      text: 'text-green-300',
      indicator: 'bg-green-400',
      message:
        playersOnline > 1
          ? `${playersOnline} summoners ready for battle`
          : 'You are the only summoner online',
    },
    loading: {
      bg: 'from-yellow-900/40 to-yellow-950/40 border-yellow-500/30',
      text: 'text-yellow-300',
      indicator: 'bg-yellow-400 animate-pulse',
      message: 'Reconnecting to the Rift...',
    },
    off: {
      bg: 'from-red-900/40 to-red-950/40 border-red-500/30',
      text: 'text-red-300',
      indicator: 'bg-red-400',
      message: 'Server is currently offline',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'rounded-lg border-2 backdrop-blur-md p-3',
        'bg-linear-to-r',
        config.bg,
        'transition-all duration-300'
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <div className={cn('w-3 h-3 rounded-full', config.indicator)} />
        <p className={cn('text-sm font-semibold uppercase tracking-wide', config.text)}>
          {config.message}
        </p>
      </div>
    </div>
  )
}
