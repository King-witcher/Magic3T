import { GetUserResult } from '@magic3t/api-types'
import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'

type Props = {
  user: GetUserResult
}

const CLASS_NAMES = [
  'fill-green-500/20 stroke-green-500',
  'fill-gray-500/20 stroke-gray-500',
  'fill-red-500/20 stroke-red-500',
]

export function StatsChart({ user }: Props) {
  const { wins, draws, defeats } = user.stats
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={[
                { name: 'Wins', value: wins },
                { name: 'Draws', value: draws },
                { name: 'Defeats', value: defeats },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              cornerRadius={5}
              strokeWidth={1}
              stroke="#0a1428"
              shape={(props) => <Sector {...props} className={CLASS_NAMES[props.index]} />}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-gold-1 font-serif font-bold text-3xl">
            {user.stats.wins + user.stats.draws + user.stats.defeats}
          </span>
          <span className="text-gold-3 font-serif text-sm tracking-wider">MATCHES</span>
        </div>
      </div>
      <div className="flex flex-col text-sm">
        <div className="flex items-center justify-between gap-4 min-w-45">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500" />
            <span className="text-grey-1 font-medium">Wins</span>
          </div>
          <span className="text-grey-1 font-bold font-serif">{wins}</span>
        </div>
        <div className="flex items-center justify-between gap-4 min-w-45">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-500/20 border border-gray-500" />
            <span className="text-grey-1 font-medium">Draws</span>
          </div>
          <span className="text-grey-1 font-bold font-serif">{draws}</span>
        </div>
        <div className="flex items-center justify-between gap-4 min-w-45">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500" />
            <span className="text-grey-1 font-medium">Defeats</span>
          </div>
          <span className="text-grey-1 font-bold font-serif">{defeats}</span>
        </div>
      </div>
    </div>
  )
}
