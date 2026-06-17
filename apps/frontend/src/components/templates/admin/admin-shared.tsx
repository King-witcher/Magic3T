import { ClientRank, UserRole } from '@magic3t/common-types'
import { IconType } from 'react-icons'
import { GiCheckedShield, GiCrown, GiRobotGrab } from 'react-icons/gi'
import { IoPerson } from 'react-icons/io5'
import { cn } from '@/lib/utils'
import { leaguesMap, provisionalLeagueInfo } from '@/utils/ranks'

type RoleMeta = {
  label: string
  Icon: IconType
  className: string
}

/** Visual metadata for each user role, used by badges across the admin panel. */
export const roleMeta: Record<UserRole, RoleMeta> = {
  superuser: {
    label: 'Super User',
    Icon: GiCrown,
    className: 'text-gold-4 border-gold-4/60 bg-gold-5/10',
  },
  admin: {
    label: 'Admin',
    Icon: GiCheckedShield,
    className: 'text-blue-2 border-blue-2/50 bg-blue-4/15',
  },
  bot: {
    label: 'Bot',
    Icon: GiRobotGrab,
    className: 'text-grey-1 border-grey-1/40 bg-grey-2/40',
  },
  player: {
    label: 'Player',
    Icon: IoPerson,
    className: 'text-gold-2 border-gold-5/40 bg-gold-6/10',
  },
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const { label, Icon, className: roleClassName } = roleMeta[role]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded border',
        'text-[0.65rem] font-serif uppercase tracking-wider',
        roleClassName,
        className
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

const DIVISION_STRINGS = ['', 'I', 'II', 'III', 'IV']

function leagueInfoOf(rank: ClientRank) {
  if (rank.league && leaguesMap[rank.league]) return leaguesMap[rank.league]
  return provisionalLeagueInfo
}

/** Builds a human-readable rank string, e.g. "Gold II", "Master · 120 LP" or "Unranked". */
export function rankToString(rank: ClientRank): string {
  if (rank.league === null) return 'Unranked'
  const info = leagueInfoOf(rank)
  const isApex = rank.league === 'master' || rank.league === 'challenger'
  if (isApex) return `${info.name} · ${rank.lp ?? 0} LP`
  const division = rank.division ? DIVISION_STRINGS[rank.division] : ''
  return `${info.name} ${division}`.trim()
}

export function RankBadge({ rank, className }: { rank: ClientRank; className?: string }) {
  const info = leagueInfoOf(rank)
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <img src={info.icon} alt="" className="size-6 shrink-0 drop-shadow" />
      <span className="text-gold-2 text-sm font-serif whitespace-nowrap">{rankToString(rank)}</span>
    </div>
  )
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}
