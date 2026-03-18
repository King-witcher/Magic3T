import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gold-4/30 pb-3 mb-6">
      <Icon className="text-gold-3 text-3xl shrink-0" />
      <h2 className="font-serif font-bold text-2xl md:text-3xl text-gold-3 uppercase tracking-wide">
        {children}
      </h2>
    </div>
  )
}

export function SubsectionTitle({ className, ...rest }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'font-serif font-semibold text-xl text-gold-2 uppercase tracking-wide mb-3',
        className
      )}
      {...rest}
    />
  )
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-grey-1 leading-relaxed mb-4">{children}</p>
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="text-gold-4 font-semibold">{children}</span>
}
