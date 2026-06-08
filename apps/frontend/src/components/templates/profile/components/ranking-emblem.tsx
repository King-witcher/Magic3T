import { ClientRank } from '@magic3t/common-types'
import { leaguesMap, provisionalLeagueInfo } from '@/utils/ranks'

const DIVISION_STRINGS = ['I', 'II', 'III', 'IV', 'V']

type Props = {
  rating: ClientRank
}

export function RankingEmblem({ rating }: Props) {
  const leagueInfo = rating.league ? leaguesMap[rating.league] : provisionalLeagueInfo

  return (
    <div className="flex flex-col items-center">
      <img src={leagueInfo.emblemOldest} alt="" className="w-56 object-contain" />
      <p className="text-gold-1 tracking-wider font-serif font-medium text-2xl">
        {leagueInfo.name} {rating.division ? DIVISION_STRINGS[rating.division - 1] : ''}
      </p>
      {rating.league !== null && (
        <p className="text-gold-4 tracking-wider font-serif font-bold text-lg">{rating.lp} LP</p>
      )}
      {rating.league === null && (
        <p className="text-grey-1 tracking-wider font-serif font-bold text-lg">Placement</p>
      )}
    </div>
  )
}
