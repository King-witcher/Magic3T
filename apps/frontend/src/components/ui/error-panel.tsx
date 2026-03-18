import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function ErrorPanel({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative backdrop-blur-xl bg-linear-to-b from-red-900/30 to-red-950/40 border-2 border-red-600/40 p-8 shadow-2xl shadow-red-900/50',
        className
      )}
      {...props}
    >
      {/* Decorative corner elements */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-red-500/60" />
      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-red-500/60" />
      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-red-500/60" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-red-500/60" />

      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />

      {children}
    </div>
  )
}
