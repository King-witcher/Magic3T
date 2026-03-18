import { GiSwordsPower } from 'react-icons/gi'
import { WinningCombinationCard } from '../-components'
import { Highlight, Paragraph, SectionTitle, SubsectionTitle } from '../-components/typography'
import { ForkStrategyDemo } from './fork-strategy-demo'

const WINNING_COMBINATIONS = [
  { numbers: [1, 5, 9], description: '1 + 5 + 9 = 15' },
  { numbers: [1, 6, 8], description: '1 + 6 + 8 = 15' },
  { numbers: [2, 4, 9], description: '2 + 4 + 9 = 15' },
  { numbers: [2, 5, 8], description: '2 + 5 + 8 = 15' },
  { numbers: [2, 6, 7], description: '2 + 6 + 7 = 15' },
  { numbers: [3, 4, 8], description: '3 + 4 + 8 = 15' },
  { numbers: [3, 5, 7], description: '3 + 5 + 7 = 15' },
  { numbers: [4, 5, 6], description: '4 + 5 + 6 = 15' },
]

export function StrategySection() {
  return (
    <section>
      <SectionTitle icon={GiSwordsPower}>Advanced Strategy Guide</SectionTitle>

      <div className="space-y-6">
        <div>
          <SubsectionTitle>Blocking Movements</SubsectionTitle>
          <Paragraph>
            Every number you pick serves two purposes: it brings you closer to a winning combination
            AND prevents your opponent from using that number. This dual nature makes every choice
            critical. Sometimes the best move isn&apos;t picking a number you need — it&apos;s
            taking a number your opponent desperately needs.
          </Paragraph>
        </div>

        {/* Fork strategies */}
        <div>
          <SubsectionTitle>Fork Strategies</SubsectionTitle>
          <Paragraph>
            A <Highlight>fork</Highlight> is the most powerful tactical pattern in Magic3T. It
            occurs when you position your numbers to threaten two different winning combinations at
            once. Since your opponent can only block one threat per turn, a successful fork can very
            unpredictably define the outcome of a game!
          </Paragraph>

          <ForkStrategyDemo />
        </div>

        {/* Winning Combinations */}
        <div>
          <SubsectionTitle>Winning Combinations</SubsectionTitle>
          <Paragraph>
            There are exactly <Highlight>8 different ways to win</Highlight> in Magic3T. Each
            winning combination consists of three numbers that add up to 15. Memorizing these
            combinations will give you a significant advantage:
          </Paragraph>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {WINNING_COMBINATIONS.map((combo) => (
              <WinningCombinationCard
                key={combo.description}
                numbers={combo.numbers}
                description={combo.description}
              />
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <p className="text-blue-200 text-sm">
              <Highlight>Pro Tip:</Highlight> Notice that the number{' '}
              <span className="text-gold-2 font-bold">5</span> appears in 4 winning combinations —
              more than any other number! The numbers{' '}
              <span className="text-gold-2 font-bold">2, 4, 6, 8</span> (the even numbers except 5)
              each appear in 3 combinations, while{' '}
              <span className="text-gold-2 font-bold">1, 3, 7, 9</span> appear in only 2 each.
            </p>
          </div>
        </div>

        <div>
          <SubsectionTitle>The Perfect Balance</SubsectionTitle>
          <Paragraph>
            Magic3T is a balanced game — there is{' '}
            <Highlight>no guaranteed winning strategy</Highlight>. With optimal play from both
            sides, every game would end in a draw. This means victory comes from outthinking your
            opponent, not from knowing a &quot;secret trick.&quot;
          </Paragraph>
        </div>

        <div>
          <SubsectionTitle>The Secret Strategy</SubsectionTitle>
          <Paragraph>
            There is a very strong secret strategy in Magic3T that probably Math lovers might know,
            but I won't teach it for free. If you manage to discover it by yourself, It's yours and
            I strongly encourage you not to share it with others for free!
          </Paragraph>
        </div>
      </div>
    </section>
  )
}
