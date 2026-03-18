import { IoSchool } from 'react-icons/io5'
import { BoardState, DemoBoard } from '../-components'
import { Highlight, Paragraph, SectionTitle } from '../-components/typography'

const exampleBoardState: BoardState = {
  1: 'available',
  2: 'highlight-ally',
  3: 'ally',
  4: 'highlight-ally',
  5: 'enemy',
  6: 'available',
  7: 'enemy',
  8: 'enemy',
  9: 'highlight-ally',
}

export function RulesSection() {
  return (
    <section>
      <SectionTitle icon={IoSchool}>The Rules</SectionTitle>
      <Paragraph>
        <Highlight>Magic3T</Highlight> is a strategic turn-based math game where two players take
        turns picking numbers from 1 to 9, and once a number is picked, it belongs exclusively to
        that player — your opponent cannot use it.
      </Paragraph>

      <Paragraph>
        Your goal is simple: collect as many numbers you need, but be the first player to have a{' '}
        <Highlight>trio</Highlight> of numbers that <Highlight>add up to 15</Highlight>. If all nine
        numbers are picked and neither player has achieved a winning combination, the game ends in a{' '}
        <Highlight>draw</Highlight>.
      </Paragraph>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 my-6">
        <div className="flex flex-col items-center gap-3">
          <span className="text-gold-3 font-serif text-lg">Example Board</span>
          <DemoBoard boardState={exampleBoardState} />
          <span className="text-grey-1 text-sm text-center max-w-48">
            Blue wins with 2 + 4 + 9 = 15!
          </span>
        </div>

        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="size-4 rounded bg-blue-500/60 border border-blue-400" />
            <span className="text-grey-1">Your numbers (Blue)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-4 rounded bg-red-500/60 border border-red-400" />
            <span className="text-grey-1">Opponent&apos;s numbers (Red)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-4 rounded bg-hextech-black/40 border border-gold-5/50" />
            <span className="text-grey-1">Available numbers</span>
          </div>
        </div>
      </div>

      <Paragraph>
        Magic3T rewards players who can think ahead and anticipate their opponent&apos;s moves.
      </Paragraph>
    </section>
  )
}
