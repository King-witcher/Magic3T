import { IoGameController } from 'react-icons/io5'
import { SectionTitle } from '../-components/typography'

export function SummarySection() {
  return (
    <section>
      <SectionTitle icon={IoGameController}>Summarizing</SectionTitle>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 rounded-lg bg-grey-3/40 border border-gold-5/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-gold-5/30 text-gold-3 font-bold">
              1
            </span>
            <span className="font-serif font-semibold text-gold-2">Take Turns</span>
          </div>
          <p className="text-grey-1 text-sm">
            Players alternate picking one available number per turn. Once picked, a number cannot be
            taken by either player again.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-grey-3/40 border border-gold-5/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-gold-5/30 text-gold-3 font-bold">
              2
            </span>
            <span className="font-serif font-semibold text-gold-2">Build Your Set</span>
          </div>
          <p className="text-grey-1 text-sm">
            Collect numbers strategically. You need exactly three numbers from your collection that
            sum to exactly 15 to win.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-grey-3/40 border border-gold-5/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-gold-5/30 text-gold-3 font-bold">
              3
            </span>
            <span className="font-serif font-semibold text-gold-2">Win or Block</span>
          </div>
          <p className="text-grey-1 text-sm">
            Watch both your combinations AND your opponent&apos;s! Sometimes blocking their win is
            more important than building your own.
          </p>
        </div>
      </div>
    </section>
  )
}
