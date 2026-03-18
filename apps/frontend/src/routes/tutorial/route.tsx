import { createFileRoute, Link } from '@tanstack/react-router'
import { GiCrossedSwords, GiPodium, GiTrophyCup } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { Panel } from '@/components/ui/panel'
import { RankingSection, RulesSection, StrategySection, SummarySection } from './-sections'

export const Route = createFileRoute('/tutorial')({
  component: TutorialPage,
})

function TutorialPage() {
  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-5xl">
        <Panel className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center border-b-2 border-gold-5 pb-6">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-gold-4 uppercase tracking-wide">
              Welcome to Magic3T!
            </h1>
            <p className="text-grey-1 text-sm mt-2 uppercase tracking-wider">
              Master the Art of Magic3T
            </p>
          </div>

          <RulesSection />

          <StrategySection />

          <SummarySection />

          <RankingSection />

          {/* Call to Action */}
          <section className="text-center py-4">
            <GiTrophyCup className="text-gold-4 text-5xl mx-auto mb-4" />
            <h2 className="font-serif font-bold text-2xl text-gold-2 uppercase tracking-wide mb-4">
              Ready to Play?
            </h2>
            <p className="text-grey-1 mb-6 max-w-md mx-auto">
              You&apos;ve learned the rules and strategies. Now it&apos;s time to put your skills to
              the test against real opponents or practice against bots!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/leaderboard">
                <Button variant="secondary" size="lg">
                  <GiPodium className="size-5" />
                  View Leaderboard
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg">
                  <GiCrossedSwords className="size-5" />
                  Start Playing
                </Button>
              </Link>
            </div>
          </section>
        </Panel>
      </div>
    </div>
  )
}
