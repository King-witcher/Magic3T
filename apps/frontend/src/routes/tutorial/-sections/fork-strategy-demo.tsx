import { useState } from 'react'
import { Button } from '@/components/ui'
import { BoardState, DemoBoard } from '../-components/demo-board'

type Step = {
  title: string
  description: string
  boardState: BoardState
}

const steps: Step[] = [
  {
    title: 'Initial Position',
    description: 'You (blue) have picked 3. Your opponent (red) has picked 4.',
    boardState: {
      1: 'available',
      2: 'available',
      3: 'ally',
      4: 'enemy',
      5: 'available',
      6: 'available',
      7: 'available',
      8: 'available',
      9: 'available',
    },
  },
  {
    title: 'You make a naive move',
    description: 'You pick 7. At first glance, you would never suspect this move...',
    boardState: {
      1: 'available',
      2: 'available',
      3: 'ally',
      4: 'enemy',
      5: 'available',
      6: 'available',
      7: 'highlight-ally',
      8: 'available',
      9: 'available',
    },
  },
  {
    title: 'The strategy begins',
    description: 'Then, our opponent cleverly picks 5,',
    boardState: {
      1: 'available',
      2: 'available',
      3: 'ally',
      4: 'enemy',
      5: 'highlight-enemy',
      6: 'available',
      7: 'ally',
      8: 'available',
      9: 'available',
    },
  },
  {
    title: 'The strategy begins',
    description: 'forcing you to block 6; otherwise they will win on next turn.',
    boardState: {
      1: 'available',
      2: 'available',
      3: 'ally',
      4: 'enemy',
      5: 'enemy',
      6: 'highlight-ally',
      7: 'ally',
      8: 'available',
      9: 'available',
    },
  },
  {
    title: 'The fork happens',
    description: 'Then, your opponent deviously picks 2, creating a fork!',
    boardState: {
      1: 'available',
      2: 'highlight-enemy',
      3: 'ally',
      4: 'enemy',
      5: 'enemy',
      6: 'ally',
      7: 'ally',
      8: 'available',
      9: 'available',
    },
  },
  {
    title: 'The fork happens',
    description: 'If you block 8, your opponent will win by 2 + 4 + 9.',
    boardState: {
      1: 'available',
      2: 'highlight-enemy',
      3: 'ally',
      4: 'highlight-enemy',
      5: 'enemy',
      6: 'ally',
      7: 'ally',
      8: 'ally',
      9: 'highlight-enemy',
    },
  },
  {
    title: 'The fork happens',
    description: 'If you otherwise blocked 9, your opponent would win by 2 + 5 + 8.',
    boardState: {
      1: 'available',
      2: 'highlight-enemy',
      3: 'ally',
      4: 'enemy',
      5: 'highlight-enemy',
      6: 'ally',
      7: 'ally',
      8: 'highlight-enemy',
      9: 'ally',
    },
  },
]

export function ForkStrategyDemo() {
  const [step, setStep] = useState(0)

  // Fork example: Player picks 2, 6 creating a fork with 4 and 7

  const currentStep = steps[step]

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-grey-3/40 border border-gold-5/30">
      <div className="text-center mb-2">
        <h4 className="font-serif font-bold text-lg text-gold-2">{currentStep.title}</h4>
        <p className="text-grey-1 text-sm mt-1 max-w-md">{currentStep.description}</p>
      </div>

      <DemoBoard boardState={currentStep.boardState} />

      <div className="flex items-center gap-4 mt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Previous
        </Button>
        <span className="text-grey-1 text-sm">
          Step {step + 1} of {steps.length}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          disabled={step === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
