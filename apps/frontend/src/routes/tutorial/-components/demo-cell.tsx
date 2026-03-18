import { cn } from '@/utils/utils'

export type CellState =
  | 'available'
  | 'ally'
  | 'enemy'
  | 'disabled'
  | 'highlight-ally'
  | 'highlight-enemy'

const cellStyles: Record<CellState, string> = {
  available: `
    bg-hextech-black/40 border-gold-5/50
    text-gold-2
  `,
  ally: `
    bg-linear-to-br from-blue-600/40 to-blue-800/40
    border-blue-400/70
    text-blue-200
    shadow-lg shadow-blue-500/30
  `,
  enemy: `
    bg-linear-to-br from-red-600/40 to-red-800/40
    border-red-400/70
    text-red-200
    shadow-lg shadow-red-500/30
  `,
  disabled: `
    bg-hextech-black/20 border-grey-1/20
    text-grey-1/50
  `,
  'highlight-ally': `
    bg-linear-to-br from-blue-600/40 to-blue-800/40
    border-blue-400
    text-blue-200
    shadow-lg shadow-blue-500/50
    ring-2 ring-blue-400 ring-offset-1 ring-offset-grey-3
  `,
  'highlight-enemy': `
    bg-linear-to-br from-red-600/40 to-red-800/40
    border-red-400
    text-red-200
    shadow-lg shadow-red-500/50
    ring-2 ring-red-400 ring-offset-1 ring-offset-grey-3
  `,
}

export function DemoCell({
  value,
  state = 'available',
  size = 'md',
}: {
  value: number
  state?: CellState
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'size-12 text-xl' : 'size-14 md:size-16 text-2xl md:text-3xl'
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        sizeClass,
        'rounded-lg border-2',
        'font-serif font-bold',
        'transition-all duration-200',
        cellStyles[state]
      )}
    >
      {value}
    </div>
  )
}
