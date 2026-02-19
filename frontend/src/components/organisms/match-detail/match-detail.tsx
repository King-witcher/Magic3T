import { GetMatchResult } from '@magic3t/api-types'
import { Team } from '@magic3t/common-types'
import { MatchRowEventType } from '@magic3t/database-types'
import { Link } from '@tanstack/react-router'
import { Check, Link2 } from 'lucide-react'
import { useState } from 'react'
import { GiCrown, GiSwordClash } from 'react-icons/gi'
import {
  AvatarImage,
  AvatarRoot,
  AvatarWing,
} from '@/components/templates/profile/components/profile-avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { leaguesMap } from '@/utils/ranks'

const DIVISIONS = ['I', 'II', 'III', 'IV', 'V']

interface MatchDetailProps {
  match: GetMatchResult
  className?: string
}

export function MatchDetail({ match, className }: MatchDetailProps) {
  const matchDate = new Date(match.date)

  const formattedDate = matchDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedTime = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const resultLabel =
    match.winner === null ? 'Draw' : match.winner === Team.Order ? 'Order Victory' : 'Chaos Victory'

  const resultColor =
    match.winner === null
      ? 'text-grey-1'
      : match.winner === Team.Order
        ? 'text-blue-400'
        : 'text-red-400'

  const [copied, setCopied] = useState(false)

  function copyMatchLink() {
    const url = `${window.location.origin}/matches/${match.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Match Result Banner */}
      <div className="text-center space-y-1">
        <div className={cn('font-serif font-bold text-2xl uppercase tracking-wider', resultColor)}>
          {resultLabel}
        </div>
        <div className="text-grey-1 text-sm">
          {formattedDate} &middot; {formattedTime}
        </div>
        <button
          type="button"
          onClick={copyMatchLink}
          className={cn(
            'inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded text-xs font-serif uppercase tracking-wide transition-all duration-200',
            copied
              ? 'text-green-400 bg-green-400/10 border border-green-400/30'
              : 'text-grey-1 bg-grey-1/5 border border-grey-1/20 hover:text-gold-3 hover:border-gold-5/50 hover:bg-gold-6/10'
          )}
        >
          {copied ? <Check className="size-3" /> : <Link2 className="size-3" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Players Versus Section */}
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {/* Order Player */}
        <PlayerCard player={match.order} team={Team.Order} isWinner={match.winner === Team.Order} />

        {/* VS Divider */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <GiSwordClash className="text-gold-3 text-3xl" />
          <span className="font-serif font-bold text-gold-4 text-sm uppercase tracking-widest">
            vs
          </span>
        </div>

        {/* Chaos Player */}
        <PlayerCard player={match.chaos} team={Team.Chaos} isWinner={match.winner === Team.Chaos} />
      </div>

      {/* Event Timeline */}
      {match.events.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gold-5/40 pb-2">
            <h3 className="font-serif font-bold text-gold-3 uppercase tracking-wide text-sm">
              Match Events
            </h3>
          </div>
          <div className="space-y-1.5">
            {match.events.map((event, index) => (
              <EventRow
                key={`${event.side}-${event.time}-${index}`}
                event={event}
                orderName={match.order.name}
                chaosName={match.chaos.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* LP Changes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-gold-5/40 pb-2">
          <h3 className="font-serif font-bold text-gold-3 uppercase tracking-wide text-sm">
            Rating Changes
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LpChangeCard player={match.order} label="Order" />
          <LpChangeCard player={match.chaos} label="Chaos" />
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

interface PlayerCardProps {
  player: GetMatchResult['order']
  team: Team
  isWinner: boolean
}

function PlayerCard({ player, team, isWinner }: PlayerCardProps) {
  const leagueInfo = leaguesMap[player.league]
  const teamColor = team === Team.Order ? 'text-blue-400' : 'text-red-400'
  const teamLabel = team === Team.Order ? 'Order' : 'Chaos'

  return (
    <Link
      to="/users/$nickname"
      params={{ nickname: player.name.replaceAll(' ', '') }}
      className="group flex flex-col items-center gap-2 min-w-0 flex-1 transition-all duration-200 hover:scale-105"
    >
      {/* Winner Crown */}
      <div className="h-6 flex items-center">
        {isWinner && <GiCrown className="text-gold-2 text-xl animate-pulse" />}
      </div>

      {/* Avatar */}
      <div className={cn('relative', isWinner && 'ring-2 ring-gold-4/50 rounded-full')}>
        <AvatarRoot className="size-16 sm:size-20">
          <AvatarImage icon={501} />
          <AvatarWing league={player.league} />
        </AvatarRoot>
      </div>

      {/* Name */}
      <span className="font-serif font-bold text-gold-1 truncate max-w-full text-sm sm:text-base group-hover:text-gold-2 transition-colors">
        {player.name}
      </span>

      {/* Team & League */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn('font-serif text-xs uppercase tracking-wider font-semibold', teamColor)}
        >
          {teamLabel}
        </span>
        <div className="flex items-center gap-1 text-xs text-grey-1">
          <Tooltip text={leagueInfo.name}>
            <img src={leagueInfo.icon} alt="" className="size-4" />
          </Tooltip>
          <span className="font-serif">
            {leagueInfo.name} {player.division ? DIVISIONS[player.division - 1] : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}

interface EventRowProps {
  event: GetMatchResult['events'][number]
  orderName: string
  chaosName: string
}

function EventRow({ event, orderName, chaosName }: EventRowProps) {
  const isOrder = event.side === Team.Order
  const playerName = isOrder ? orderName : chaosName
  const sideColor = isOrder ? 'text-blue-400' : 'text-red-400'
  const bgColor = isOrder ? 'bg-blue-900/20' : 'bg-red-900/20'

  let icon: string
  let description: string

  switch (event.event) {
    case MatchRowEventType.Choice:
      icon = '🎯'
      description = `chose ${event.choice}`
      break
    case MatchRowEventType.Forfeit:
      icon = '🏳️'
      description = 'forfeited'
      break
    case MatchRowEventType.Timeout:
      icon = '⏱️'
      description = 'timed out'
      break
    case MatchRowEventType.Message:
      icon = '💬'
      description = `"${event.message}"`
      break
    default:
      icon = '❓'
      description = 'unknown event'
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded transition-colors',
        bgColor,
        'border border-transparent hover:border-gold-5/30'
      )}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className={cn('font-serif font-semibold text-sm shrink-0', sideColor)}>
        {playerName}
      </span>
      <span className="text-grey-1 text-sm">{description}</span>
    </div>
  )
}

interface LpChangeCardProps {
  player: GetMatchResult['order']
  label: string
}

function LpChangeCard({ player, label }: LpChangeCardProps) {
  const lpGain = player.lp_gain
  const lpColor = lpGain > 0 ? 'text-green-400' : lpGain < 0 ? 'text-red-400' : 'text-grey-1'
  const lpPrefix = lpGain > 0 ? '+' : ''
  const labelColor = label === 'Order' ? 'text-blue-400' : 'text-red-400'

  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded bg-grey-3/50 border border-gold-5/20">
      <span className={cn('font-serif font-bold text-xs uppercase tracking-wider', labelColor)}>
        {label}
      </span>
      <span className="font-serif text-gold-1 text-sm truncate max-w-full">{player.name}</span>
      {lpGain !== 0 ? (
        <span className={cn('font-bold text-lg', lpColor)}>
          {lpPrefix}
          {lpGain} LP
        </span>
      ) : (
        <span className="text-grey-1 text-sm">No LP change</span>
      )}
      <span className="text-grey-1 text-xs">Score: {Math.round(player.score * 100)}%</span>
    </div>
  )
}
