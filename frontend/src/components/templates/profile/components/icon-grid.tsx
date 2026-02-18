import { cn, getIconUrl } from '@/utils/utils'

interface IconGridProps {
  icons: number[]
  selectedIcon: number
  onSelect: (iconId: number) => void
}

export function IconGrid({ icons, selectedIcon, onSelect }: IconGridProps) {
  return (
    <div>
      <div
        className={cn(
          'grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2',
          'max-h-76 lg:max-h-92 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold-5/40 scrollbar-track-transparent'
        )}
      >
        {icons.map((iconId) => (
          <IconGridItem
            key={iconId}
            iconId={iconId}
            isSelected={iconId === selectedIcon}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

interface IconGridItemProps {
  iconId: number
  isSelected: boolean
  onSelect: (iconId: number) => void
}

function IconGridItem({ iconId, isSelected, onSelect }: IconGridItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(iconId)}
      className={cn(
        'relative aspect-square rounded-sm overflow-hidden border-2 transition-all duration-200 cursor-pointer',
        'hover:scale-105 hover:border-gold-3 hover:shadow-lg hover:shadow-gold-5/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-4/50',
        isSelected
          ? 'border-gold-2 shadow-lg shadow-gold-4/40 ring-1 ring-gold-3/60'
          : 'border-gold-5/30 hover:border-gold-4/60'
      )}
    >
      <img
        src={getIconUrl(iconId)}
        alt={`Icon ${iconId}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {isSelected && <div className="absolute inset-0 bg-gold-4/15 pointer-events-none" />}
    </button>
  )
}
