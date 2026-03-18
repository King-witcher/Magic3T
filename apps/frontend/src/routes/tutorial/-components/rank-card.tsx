import { cn } from '@/utils/utils'

export const RANKS = [
  {
    name: 'Bronze',
    divisions: ['IV', 'III', 'II', 'I'],
    color: '',
    borderColor: 'border-amber-600/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/bronze.png`,
  },
  {
    name: 'Silver',
    divisions: ['IV', 'III', 'II', 'I'],
    color: 'from-slate-400 to-slate-600',
    borderColor: 'border-slate-400/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/silver.png`,
  },
  {
    name: 'Gold',
    divisions: ['IV', 'III', 'II', 'I'],
    color: 'from-yellow-500 to-yellow-700',
    borderColor: 'border-yellow-500/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/gold.png`,
  },
  {
    name: 'Diamond',
    divisions: ['IV', 'III', 'II', 'I'],
    color: 'from-cyan-400 to-cyan-600',
    borderColor: 'border-cyan-400/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/diamond.png`,
  },
  {
    name: 'Master',
    divisions: null,
    color: 'from-purple-500 to-purple-700',
    borderColor: 'border-purple-500/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/master.png`,
  },
  {
    name: 'Challenger',
    divisions: null,
    color: 'from-gold-4 to-gold-6',
    borderColor: 'border-gold-4/50',
    icon: `${import.meta.env.VITE_CDN_URL}/ranks-old/challenger.png`,
    special: true,
  },
]

export function RankCard({ rank }: { rank: (typeof RANKS)[number] }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center p-4 rounded-lg',
        rank.special && 'ring-2 ring-gold-4/70'
      )}
    >
      <img src={rank.icon} alt={rank.name} className="w-full" />
      <span className="font-serif font-bold text-gold-1">{rank.name}</span>
      {rank.divisions && (
        <span className="text-gold-3 text-sm font-serif">{rank.divisions.join(' → ')}</span>
      )}
      {rank.special && <span className="text-gold-3 text-xs font-semibold">Only 1 player!</span>}
    </div>
  )
}
