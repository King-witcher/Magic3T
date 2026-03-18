import { GiRaiseSkeleton } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { useGame } from '@/contexts/game-context'
import { cn } from '@/lib/utils'

interface SurrenderModalProps {
  onClose: () => void
}

export function SurrenderModal({ onClose }: SurrenderModalProps) {
  const { forfeit } = useGame()

  const handleSurrender = () => {
    forfeit()
    onClose()
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-6 p-8 min-w-100 max-w-lg',
        'rounded-lg border-2 border-red-500/50',
        'bg-linear-to-b from-red-900/40 to-red-950/40',
        'backdrop-blur-xl shadow-2xl shadow-red-500/20'
      )}
    >
      {/* Decorative corners */}
      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-red-500" />
      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-red-500" />
      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-red-500" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-red-500" />

      {/* Icon */}
      <GiRaiseSkeleton size={64} className="text-red-400" />

      {/* Title */}
      <h2 className="font-serif font-bold text-3xl text-red-300 uppercase tracking-wider">
        Surrender?
      </h2>

      {/* Description */}
      <p className="text-grey-1 text-center max-w-xs">
        You are about to surrender this match. This action cannot be undone and will count as a
        defeat.
      </p>

      {/* Buttons */}
      <div className="flex gap-4 w-full">
        <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button variant="destructive" size="md" onClick={handleSurrender} className="flex-1">
          Surrender
        </Button>
      </div>
    </div>
  )
}
