import { Choice } from '@magic3t/common-types'
import { createFileRoute } from '@tanstack/react-router'
import { RotateCcw, SkipBack, SkipForward, StepBack, StepForward } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GiCrossedSwords, GiSwordsPower } from 'react-icons/gi'
import { Button, Panel, PanelDivider } from '@/components/atoms'
import { GameBoard } from '@/components/molecules'
import { cn } from '@/lib/utils'
import { getTriple } from '@/utils/getTriple'

export const Route = createFileRoute('/playground')({
  component: RouteComponent,
})

function RouteComponent() {
  const [history, setHistory] = useState<Choice[]>([])
  const [cursor, setCursor] = useState(0)

  const orderChoices = useMemo(
    () => history.slice(0, cursor).filter((_, i) => i % 2 === 0),
    [history, cursor]
  )
  const chaosChoices = useMemo(
    () => history.slice(0, cursor).filter((_, i) => i % 2 === 1),
    [history, cursor]
  )

  const winner = useMemo(() => {
    if (orderChoices.length >= 3 && getTriple(orderChoices)) return 'order' as const
    if (chaosChoices.length >= 3 && getTriple(chaosChoices)) return 'chaos' as const
    return null
  }, [orderChoices, chaosChoices])

  const finished = winner !== null
  const isOrderTurn = cursor % 2 === 0

  function handlePick(choice: Choice) {
    const newHistory = [...history.slice(0, cursor), choice]
    setHistory(newHistory)
    setCursor(cursor + 1)
  }

  function stepBack() {
    setCursor((prev) => Math.max(prev - 1, 0))
  }

  function stepForward() {
    setCursor((prev) => Math.min(prev + 1, history.length))
  }

  function skipBack() {
    setCursor(0)
  }

  function skipForward() {
    setCursor(history.length)
  }

  function resetGame() {
    setHistory([])
    setCursor(0)
  }

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl">
        <Panel className="flex flex-col gap-6 sm:gap-8">
          {/* Header */}
          <div className="text-center border-b border-gold-5 pb-6">
            <GiSwordsPower className="text-gold-4 text-5xl mx-auto mb-3" />
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-gold-4 uppercase tracking-wide">
              Playground
            </h1>
            <p className="text-grey-1 text-sm mt-2 uppercase tracking-wider">
              Simulate matches and explore new strategies
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-start justify-center">
            {/* Left: Board + controls */}
            <div className="flex flex-col gap-6 items-center w-fit">
              {/* Player turn indicators */}
              {/* <div className="w-full grid grid-cols-2 gap-2 text-center font-serif font-bold text-sm uppercase tracking-wide">
                <div
                  className={cn(
                    'py-2 px-3 rounded border-2 transition-all duration-300 flex items-center justify-center gap-2',
                    !finished && isOrderTurn
                      ? 'bg-blue-600/20 border-blue-400/70 text-blue-200 shadow-lg shadow-blue-500/20'
                      : 'bg-hextech-black/20 border-grey-1/20 text-grey-1/50',
                    winner === 'order' &&
                      'bg-blue-600/30 border-blue-400 text-blue-100 shadow-lg shadow-blue-500/30'
                  )}
                >
                  <div className="size-2 rounded-full bg-blue-400 shrink-0" />
                  Order
                  {winner === 'order' && <span className="text-xs">✦ Won</span>}
                </div>
                <div
                  className={cn(
                    'py-2 px-3 rounded border-2 transition-all duration-300 flex items-center justify-center gap-2',
                    !finished && !isOrderTurn
                      ? 'bg-red-600/20 border-red-400/70 text-red-200 shadow-lg shadow-red-500/20'
                      : 'bg-hextech-black/20 border-grey-1/20 text-grey-1/50',
                    winner === 'chaos' &&
                      'bg-red-600/30 border-red-400 text-red-100 shadow-lg shadow-red-500/30'
                  )}
                >
                  <div className="size-2 rounded-full bg-red-400 shrink-0" />
                  Chaos
                  {winner === 'chaos' && <span className="text-xs">✦ Won</span>}
                </div>
              </div> */}

              <GameBoard
                cellClass="text-4xl"
                allyChoices={orderChoices}
                enemyChoices={chaosChoices}
                isGameOver={finished}
                onPick={handlePick}
                isMyTurn={!finished}
              />

              {/* Navigation controls */}
              <div className="self-stretch flex gap-2 sm:gap-4">
                <Button
                  size="icon"
                  variant={cursor === 0 ? 'secondary' : 'primary'}
                  className="flex-1 aspect-square"
                  onClick={skipBack}
                  disabled={cursor === 0}
                >
                  <SkipBack className="size-4 sm:size-6" />
                </Button>
                <Button
                  size="icon"
                  variant={cursor === 0 ? 'secondary' : 'primary'}
                  className="flex-1 aspect-square"
                  onClick={stepBack}
                  disabled={cursor === 0}
                >
                  <StepBack className="size-4 sm:size-6" />
                </Button>
                <Button
                  size="icon"
                  variant={cursor === history.length ? 'secondary' : 'primary'}
                  className="flex-1 aspect-square"
                  onClick={stepForward}
                  disabled={cursor === history.length}
                >
                  <StepForward className="size-4 sm:size-6" />
                </Button>
                <Button
                  size="icon"
                  variant={cursor === history.length ? 'secondary' : 'primary'}
                  className="flex-1 aspect-square"
                  onClick={skipForward}
                  disabled={cursor === history.length}
                >
                  <SkipForward className="size-4 sm:size-6" />
                </Button>
              </div>

              {/* Reset */}
              <Button variant="secondary" className="self-stretch" onClick={resetGame}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>

            {/* Vertical divider (desktop) / Horizontal (mobile) */}
            <div className="hidden md:block w-px bg-gold-5/40 self-stretch" />
            <div className="block md:hidden w-full">
              <PanelDivider />
            </div>

            {/* Right: Move History */}
            <div className="w-full flex flex-col self-stretch gap-3">
              <h2 className="font-serif font-bold text-xl text-gold-3 uppercase tracking-wide">
                History
              </h2>
              <MoveHistory history={history} cursor={cursor} onJumpTo={setCursor} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

interface MoveHistoryProps {
  history: Choice[]
  cursor: number
  onJumpTo: (index: number) => void
}

function MoveHistory({ history, cursor, onJumpTo }: MoveHistoryProps) {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  if (history.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-10 gap-3 text-grey-1/70 border-2 border-dashed border-gold-5/20 rounded">
        <GiCrossedSwords className="text-4xl" />
        <p className="text-sm uppercase tracking-wider text-center leading-relaxed">
          No moves yet
          <br />
          Click a number to start!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 max-h-80 lg:max-h-[420px] overflow-y-auto pr-1">
      {history.map((choice, index) => {
        const isOrder = index % 2 === 0
        const moveNumber = index + 1
        const isFuture = index >= cursor
        const isCurrentEdge = index === cursor - 1

        return (
          <div
            key={`move-${
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              index
            }`}
          >
            <button
              type="button"
              onClick={() => onJumpTo(index + 1)}
              className={cn(
                'w-full flex items-center gap-3 py-2 px-3 rounded transition-colors duration-200 text-left group border-gold-4/50 box-border',
                isFuture ? 'opacity-35 hover:opacity-60 hover:bg-grey-1/10' : 'hover:bg-gold-5/15',
                isCurrentEdge && 'bg-gold-6/25 border'
              )}
            >
              {/* Move number */}
              <span className="shrink-0 w-5 text-center text-xs text-grey-1/50 font-serif">
                {moveNumber}
              </span>

              {/* Player dot */}
              <div
                className={cn(
                  'shrink-0 size-2.5 rounded-full',
                  isOrder ? 'bg-blue-500' : 'bg-red-500'
                )}
              />

              {/* Player name */}
              <span
                className={cn(
                  'flex-1 text-sm font-serif',
                  isFuture ? 'text-grey-1/40' : 'text-gold-3'
                )}
              >
                {isOrder ? 'Order' : 'Chaos'}
              </span>

              {/* Chosen number */}
              <span
                className={cn(
                  'shrink-0 w-6 border aspect-square rounded text-center text-base font-serif',
                  isOrder
                    ? 'bg-blue-400/10 border-blue-600 text-blue-500'
                    : 'bg-red-400/10 border-red-600 text-red-600'
                )}
              >
                {choice}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
