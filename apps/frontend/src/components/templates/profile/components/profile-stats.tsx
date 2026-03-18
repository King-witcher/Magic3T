import { GetUserResult } from '@magic3t/api-types'
import { ComponentProps } from 'react'
import { cn } from '@/utils/utils'
import { RankingEmblem } from './ranking-emblem'
import { StatsChart } from './stats-chart'

type ProfileStatsProps = ComponentProps<'div'> & {
  user: GetUserResult
}

export function ProfileStats({ user, className, ...props }: ProfileStatsProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <h2 className="font-serif font-bold text-xl text-gold-3 uppercase tracking-wide border-b border-gold-5/50 pb-2">
        Ranked Stats
      </h2>

      <div className="flex gap-4 flex-col md:flex-row md:gap-0 w-full items-center justify-evenly">
        <RankingEmblem rating={user.rank} />
        <StatsChart user={user} />
      </div>
    </div>
  )
}
