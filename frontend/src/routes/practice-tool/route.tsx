import { Choice } from '@magic3t/common-types'
import { createFileRoute } from '@tanstack/react-router'
import { SkipBack, SkipForward, StepBack, StepForward } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Panel } from '@/components/atoms'
import { GameBoard } from '@/components/molecules'
import { getTriple } from '@/utils/getTriple'

export const Route = createFileRoute('/practice-tool')({
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

  const finished = useMemo(() => {
    const orderWon = orderChoices.length >= 3 && getTriple(orderChoices) !== null
    const chaosWon = chaosChoices.length >= 3 && getTriple(chaosChoices) !== null
    return orderWon || chaosWon
  }, [orderChoices, chaosChoices])

  function handlePick(choice: Choice) {
    setCursor((prev) => prev + 1)
    setHistory((prev) => [...prev.slice(0, cursor), choice])
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

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Panel className="flex flex-col gap-8">
        <h1 className="text-4xl text-gold-4 font-medium font-serif text-center">PRACTICE TOOL</h1>
        <GameBoard
          allyChoices={orderChoices}
          enemyChoices={chaosChoices}
          isGameOver={finished}
          onPick={handlePick}
          isMyTurn
        />
        <div className="w-full flex gap-8">
          <Button
            size="icon"
            variant={cursor === 0 ? 'secondary' : 'primary'}
            className="flex-1 aspect-square"
            onClick={skipBack}
            disabled={cursor === 0}
          >
            <SkipBack />
          </Button>
          <Button
            size="icon"
            variant={cursor === 0 ? 'secondary' : 'primary'}
            className="flex-1 aspect-square"
            onClick={stepBack}
            disabled={cursor === 0}
          >
            <StepBack />
          </Button>
          <Button
            size="icon"
            variant={cursor === history.length ? 'secondary' : 'primary'}
            className="flex-1 aspect-square"
            onClick={stepForward}
            disabled={cursor === history.length}
          >
            <StepForward />
          </Button>
          <Button
            size="icon"
            variant={cursor === history.length ? 'secondary' : 'primary'}
            className="flex-1 aspect-square"
            onClick={skipForward}
            disabled={cursor === history.length}
          >
            <SkipForward />
          </Button>
        </div>
      </Panel>
    </div>
  )
}
