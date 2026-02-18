import { Choice } from '@magic3t/common-types'
import { ComponentProps, useCallback, useMemo } from 'react'
import { Panel } from '@/components/atoms'
import { Console, SystemCvars } from '@/lib/console'
import { cn } from '@/lib/utils'
import { getTriple } from '@/utils/getTriple'
import { NumberCell } from './number-cell'

interface GameBoardProps extends ComponentProps<'div'> {
  allyChoices: Choice[]
  enemyChoices: Choice[]
  isMyTurn: boolean
  isGameOver: boolean
  cellClass?: string
  onPick: (choice: Choice) => void
}

const normalNumbers: Choice[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const magicSquareNumbers: Choice[] = [8, 1, 6, 3, 5, 7, 4, 9, 2]

export function GameBoard({
  allyChoices,
  enemyChoices,
  isMyTurn,
  isGameOver,
  cellClass,
  onPick,
  className,
  ...props
}: GameBoardProps) {
  const magicSquare = Console.useCvarBoolean(SystemCvars.Ui3TMode)
  const numbers = magicSquare ? magicSquareNumbers : normalNumbers

  const allyChoicesSet = useMemo(() => new Set(allyChoices), [allyChoices])
  const enemyChoicesSet = useMemo(() => new Set(enemyChoices), [enemyChoices])

  // Find winning triple if exists
  const winningTriple = useMemo(() => {
    if (allyChoices.length >= 3) {
      const triple = getTriple(allyChoices)
      if (triple) return triple
    }
    if (enemyChoices.length >= 3) {
      const triple = getTriple(enemyChoices)
      if (triple) return triple
    }
    return null
  }, [allyChoices, enemyChoices])

  const getCellState = useCallback(
    (num: Choice) => {
      if (allyChoicesSet.has(num)) return 'ally' as const
      if (enemyChoicesSet.has(num)) return 'enemy' as const
      if (isGameOver || !isMyTurn) return 'disabled' as const
      return 'available' as const
    },
    [allyChoicesSet, enemyChoicesSet, isGameOver, isMyTurn]
  )

  return (
    <Panel
      className={cn(
        'relative p-5 md:p-6',
        'bg-linear-to-br from-grey-3/80 to-grey-2/80',
        className
      )}
      {...props}
    >
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 w-80">
        {numbers.map((num) => (
          <NumberCell
            key={num}
            value={num}
            state={getCellState(num)}
            highlight={winningTriple?.includes(num)}
            onClick={() => onPick(num)}
            className={cellClass}
          />
        ))}
      </div>

      {/* Turn indicator overlay */}
      {!isGameOver && !isMyTurn && (
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
          <span className="text-gold-3 font-serif text-2xl font-bold uppercase tracking-wider animate-pulse select-none">
            Opponent&apos;s Turn
          </span>
        </div>
      )}
    </Panel>
  )
}
