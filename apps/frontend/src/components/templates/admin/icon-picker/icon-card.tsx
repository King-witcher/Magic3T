import { Admin } from '@magic3t/api-types'
import { IoCheckmarkCircle } from 'react-icons/io5'
import { TooltipContent, TooltipRoot, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getGameIconUrl } from '@/utils/utils'

interface IconCardProps {
  icon: Admin.IconCatalogueItem
  isSelected: boolean
  isOwned: boolean
  onSelect: (iconId: number) => void
}

export function IconCard({ icon, isSelected, isOwned, onSelect }: IconCardProps) {
  return (
    <TooltipRoot delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(icon.id)}
          aria-pressed={isSelected}
          className={cn(
            'group/icon flex flex-col items-center gap-1.5 p-1.5 rounded text-center cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-4/60',
            'transition-colors',
            isSelected ? 'bg-gold-5/20' : 'hover:bg-gold-6/15'
          )}
        >
          <div
            className={cn(
              'relative aspect-square w-full overflow-hidden rounded border-2 transition-all duration-200',
              isSelected
                ? 'border-gold-2 shadow-lg shadow-gold-4/40'
                : 'border-gold-5/30 group-hover/icon:border-gold-4/60'
            )}
          >
            <img
              src={getGameIconUrl(icon.id)}
              alt={icon.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.style.opacity = '0'
              }}
            />
            {isOwned && (
              <span className="absolute top-0.5 right-0.5 leading-none rounded-full bg-hextech-black/80">
                <IoCheckmarkCircle className="size-4 text-green-400" />
              </span>
            )}
            {isSelected && <span className="absolute inset-0 bg-gold-4/15 pointer-events-none" />}
          </div>
          <span className="w-full text-[0.7rem] leading-tight text-gold-2 line-clamp-2">
            {icon.title}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-serif font-bold text-gold-1">{icon.title}</p>
        {icon.description ? (
          <p className="mt-1 text-grey-1">{icon.description}</p>
        ) : (
          <p className="mt-1 text-grey-1 italic">Sem descrição.</p>
        )}
        <p className="mt-1 text-gold-4 capitalize">
          {icon.rarity}
          {icon.yearReleased ? ` · ${icon.yearReleased}` : ''}
          {isOwned ? ' · Possui' : ''}
        </p>
      </TooltipContent>
    </TooltipRoot>
  )
}
