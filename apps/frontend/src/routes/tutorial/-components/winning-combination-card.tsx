import { Choice } from '@magic3t/common-types'
import { BoardState, DemoBoard } from './demo-board'

export function WinningCombinationCard({
  numbers,
  description,
}: {
  numbers: number[]
  description: string
}) {
  const boardState: BoardState = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, n) => {
    acc[n as Choice] = numbers.includes(n) ? 'highlight-ally' : 'disabled'
    return acc
  }, {} as BoardState)

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-grey-3/40 border border-gold-5/20">
      <DemoBoard boardState={boardState} size="sm" />
      <span className="text-gold-3 font-mono text-sm">{description}</span>
    </div>
  )
}
