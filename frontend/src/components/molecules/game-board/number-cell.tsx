import { Choice } from '@magic3t/common-types'
import { cva, type VariantProps } from 'class-variance-authority'
import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface NumberCellProps extends ComponentProps<'button'> {
  value: Choice
  state: VariantProps<typeof cellVariants>['state']
  highlight?: boolean
}

const cellVariants = cva(
  `
  relative flex items-center justify-center
  ${/*size-20 md:size-22 lg:size-24*/ ''}
  aspect-square
  rounded-lg border-2
  font-serif font-bold text-4xl md:text-5xl lg:text-5xl
  transition-all duration-200
`,
  {
    variants: {
      state: {
        available: `
          bg-hextech-black/40 border-gold-5/50
          hover:bg-gold-6/30 hover:border-gold-4 hover:scale-105
          cursor-pointer
          text-gold-2 hover:text-gold-1
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
          cursor-not-allowed
        `,
      },
    },
  }
)

export function NumberCell({
  value,
  state,
  highlight,
  onClick,
  className,
  ...props
}: NumberCellProps) {
  return (
    <button
      type="button"
      onClick={state === 'available' ? onClick : undefined}
      disabled={state === 'disabled'}
      className={cn(
        cellVariants({ state }),
        highlight && 'ring-2 ring-gold-3 ring-offset-2 ring-offset-grey-3 animate-pulse',
        className
      )}
      {...props}
    >
      {/* Inner glow for selected states */}
      {(state === 'ally' || state === 'enemy') && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg opacity-30',
            state === 'ally' && 'bg-radial-[at_center] from-blue-400/50 to-transparent',
            state === 'enemy' && 'bg-radial-[at_center] from-red-400/50 to-transparent'
          )}
        />
      )}

      {/* Number */}
      <span className="relative select-none">{value}</span>

      {/* Hover shine effect for available cells */}
      {state === 'available' && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-500 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
    </button>
  )
}
