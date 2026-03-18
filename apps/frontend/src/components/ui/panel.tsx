import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type PanelProps = ComponentProps<'div'>

export function Panel({ className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'relative backdrop-blur-lg bg-linear-to-b from-grey-3/85 to-grey-3/75 border-2 border-gold-5/60 p-8 shadow-2xl shadow-black/50',
        className
      )}
      {...props}
    >
      {/* Decorative corner elements */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-3 border-l-3 border-gold-4" />
      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-3 border-r-3 border-gold-4" />
      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-3 border-l-3 border-gold-4" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-3 border-r-3 border-gold-4" />
      {children}
    </div>
  )
}

export function PanelDivider() {
  return (
    <div className="relative w-full">
      {/* Horizontal Line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gold-5" />
      </div>

      <div className="relative flex h-8 justify-center items-center">
        {/* <div className="size-2 bg-gold-4 rotate-45" /> */}
        <svg preserveAspectRatio="none" viewBox="0 0 22 13" className="h-[13px] w-[22px]">
          <title>Diamond</title>
          <polygon
            points="0,6.5 11,1 22,6.5 11,12"
            className="fill-gold-2 stroke-gold-5"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  )
}
