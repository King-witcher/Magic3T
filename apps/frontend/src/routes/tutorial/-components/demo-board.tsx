import { Choice } from '@magic3t/common-types'
import { Console, SystemCvars } from '@/lib/console'
import { cn } from '@/utils/utils'
import { CellState, DemoCell } from './demo-cell'

export const SEQUENCE_NUMBERS: Choice[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const MAGIC_SQUARE_NUMBERS: Choice[] = [8, 1, 6, 3, 5, 7, 4, 9, 2]

export type BoardState = Record<Choice, CellState>

type Props = {
  boardState: BoardState
  size?: 'sm' | 'md'
}

export function DemoBoard({ boardState, size = 'md' }: Props) {
  const values = Console.useCvarBoolean(SystemCvars.Ui3TMode)
    ? MAGIC_SQUARE_NUMBERS
    : SEQUENCE_NUMBERS

  const gapClass = size === 'sm' ? 'gap-1.5' : 'gap-2'
  return (
    <div className={cn('grid grid-cols-3', gapClass)}>
      {values.map((num) => (
        <DemoCell key={num} value={num as Choice} state={boardState[num]} size={size} />
      ))}
    </div>
  )
}
