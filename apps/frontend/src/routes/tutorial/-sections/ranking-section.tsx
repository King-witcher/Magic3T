import { GiHourglass, GiJusticeStar, GiPodium, GiScales } from 'react-icons/gi'
import { RANKS, RankCard } from '../-components'
import { Highlight, Paragraph, SectionTitle, SubsectionTitle } from '../-components/typography'

function InfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType
  children: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-lg bg-grey-3/40 border border-gold-5/20">
      <SubsectionTitle className="flex items-center gap-2">
        <Icon />
        {title}
      </SubsectionTitle>
      <p className="text-grey-1 text-sm">{children}</p>
    </div>
  )
}

export function RankingSection() {
  return (
    <section>
      <SectionTitle icon={GiPodium}>Ranking System</SectionTitle>
      <Paragraph>
        Magic3T features a competitive ranking system to measure your skill against other players.
        The game classifies players into 6 different Leagues, some of which are further split into 4
        divisions:
      </Paragraph>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-6 mb-4">
        {RANKS.map((rank) => (
          <RankCard key={rank.name} rank={rank} />
        ))}
      </div>

      <Paragraph>
        You must play 5 matches to unlock your ranking. As you win, lose or draw matches against
        bots or humans, you will gain or lose League Points (LP) based on the rank of your opponent.
        Accumulate <Highlight>100 LP</Highlight> to be promoted to the next League, or drop{' '}
        <Highlight>below 0 LP</Highlight> to be demoted.
      </Paragraph>

      <div className="space-y-4 mt-6">
        <InfoSection title="Divisions and Promotions" icon={GiPodium}>
          The ranks Bronze, Silver, Gold, and Diamond are divided into{' '}
          <Highlight>4 divisions each</Highlight> (IV, III, II, I). Division IV is the starting
          point, and Division I is the highest within that rank. Reach 100 League points (LP) in
          your current division to be promoted to the next division or rank. Conversely, if your LP
          drops below 0, you will be demoted to the previous division or rank.
        </InfoSection>

        <InfoSection title="Apex Tiers: Master & Challenger" icon={GiJusticeStar}>
          Master and Challenger are the elite ranks with no divisions. In Master, you compete on LP
          alone, up to infinity. <Highlight>Challenger is the ultimate rank</Highlight> — and
          here&apos;s what makes it special:{' '}
          <span className="text-gold-2 font-bold">only ONE player</span> can hold the Challenger
          title at any time!
          <br />
          To become Challenger, you must be at rank #1 in Master and have, at least, 100 LP at 0:00
          UTC, when the Challenger rank is updated. Losing your #1 spot will not immediately demote
          you from Challenger, but if you drop below #1 at the next update, you will be demoted back
          to Master.
        </InfoSection>

        <InfoSection title="LP Gain Fairness" icon={GiScales}>
          At the end of each match, the system <Highlight>estimates your performance</Highlight> in
          the match and gives or takes away League Points (LP){' '}
          <Highlight>based on your opponent&apos;s rank</Highlight>. Beating higher-ranked players
          rewards you with more LP, while losing to lower-ranked players costs you more LP. This
          system encourages players to always strive to win, since better performance is required
          for not losing LP against lower-ranked players, and weaker players can still take LP from
          stronger opponents by outperforming the system&apos;s expectations.
        </InfoSection>

        <InfoSection title="Draws & Time-based Scoring" icon={GiHourglass}>
          If all nine numbers are picked and neither player has achieved a winning combination, the
          game ends in a <Highlight>draw</Highlight>. However, instead of assigning both players a
          half-win score, Magic3T uses a <Highlight>time-based score</Highlight> from{' '}
          <span className="font-semibold text-red-700">-100</span> to{' '}
          <span className="font-semibold text-green-600">+100</span> to measure their performance.
          The player who used less time during the match receives a positive score and might gain LP
          if they outperformed expectations, while the slower player receives a negative score and
          might lose LP. This encourages <Highlight>efficient decision-making</Highlight> and
          prevents games from becoming tedious time-stalling contests at higher ranks, while also
          encouraging stronger players to always do their best even against weaker opponents.
        </InfoSection>
      </div>
    </section>
  )
}
