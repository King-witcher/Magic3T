import type { Admin } from '@magic3t/api-types'
import { League } from '@magic3t/common-types'
import { UserRole } from '@magic3t/database-types'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { GiCrown, GiRobotGrab } from 'react-icons/gi'
import { Spinner } from '@/components/atoms'
import { Panel } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'
import { divisionMap, leaguesMap } from '@/utils/ranks'
import { getIconUrl } from '@/utils/utils'

export const Route = createFileRoute('/_auth-guarded/_admin_guarded/admin')({
  component: AdminPage,
})

function AdminPage() {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<Admin.ListAccountsResultItem | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin', 'accounts'],
    queryFn: () => apiClient.admin.listAccounts(),
  })

  const users = usersQuery.data?.users ?? []
  const filteredUsers = users.filter((user) => {
    if (!search) return true
    const query = search.toLowerCase()
    if (user.id.toLowerCase().includes(query)) return true
    if (user.userRow?.identification.nickname.toLowerCase().includes(query)) return true
    if (user.userRow?.identification.unique_id.toLowerCase().includes(query)) return true
    return false
  })

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* Header */}
        <Panel className="flex-col">
          <div className="text-center border-b-2 border-gold-5 pb-6 mb-6">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-gold-4 uppercase tracking-wide">
              Admin Panel
            </h1>
            <p className="text-grey-1 text-sm mt-2 uppercase tracking-wider">Account Management</p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by nickname, slug or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <span className="text-grey-1 text-sm shrink-0">
              {filteredUsers.length} / {users.length} accounts
            </span>
          </div>
        </Panel>

        {/* Content */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* User List */}
          <Panel className="flex-col flex-1 min-w-0 !p-4 sm:!p-6">
            <h2 className="font-serif font-bold text-xl text-gold-3 uppercase tracking-wider mb-4">
              Accounts
            </h2>

            {usersQuery.isLoading && (
              <div className="flex justify-center py-12">
                <Spinner className="size-12" />
              </div>
            )}

            {usersQuery.isError && (
              <p className="text-red-400 text-center py-8">Failed to load accounts.</p>
            )}

            {usersQuery.isSuccess && (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {filteredUsers.map((user) => (
                  <AccountRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUser?.id === user.id}
                    onSelect={() => setSelectedUser(user)}
                  />
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-grey-1 text-center py-8">No accounts match your search.</p>
                )}
              </div>
            )}
          </Panel>

          {/* Detail Panel */}
          <Panel className="flex-col lg:w-96 shrink-0 !p-4 sm:!p-6">
            <h2 className="font-serif font-bold text-xl text-gold-3 uppercase tracking-wider mb-4">
              Details
            </h2>
            {selectedUser ? (
              <AccountDetail user={selectedUser} />
            ) : (
              <p className="text-grey-1 text-center py-12 text-sm">
                Select an account to view details.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function AccountRow({
  user,
  isSelected,
  onSelect,
}: {
  user: Admin.ListAccountsResultItem
  isSelected: boolean
  onSelect: () => void
}) {
  const hasData = user.userRow !== null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full group relative flex items-center gap-3 p-3 rounded text-left',
        'bg-linear-to-r from-grey-3/40 to-grey-3/20',
        'border-2 transition-all duration-200 cursor-pointer',
        'hover:from-gold-5/20 hover:to-gold-5/10 hover:border-gold-4/60',
        isSelected
          ? 'border-gold-4/70 from-gold-5/20 to-gold-5/10 shadow-lg shadow-gold-5/20'
          : 'border-gold-5/20'
      )}
    >
      {/* Icon */}
      <img
        className="size-9 rounded-full border-2 border-gold-5/50 group-hover:border-gold-4 transition-colors shrink-0"
        alt="icon"
        src={getIconUrl(hasData ? user.userRow.summoner_icon : undefined)}
      />

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {hasData && user.userRow.role === UserRole.Bot && (
            <Tooltip text="Bot account">
              <GiRobotGrab className="text-gold-4 size-4 shrink-0" />
            </Tooltip>
          )}
          {hasData && user.userRow.role === UserRole.Creator && (
            <Tooltip text="Creator account">
              <GiCrown className="text-gold-4 size-4 shrink-0" />
            </Tooltip>
          )}
          <span className="text-sm font-semibold text-gold-1 truncate">
            {hasData ? user.userRow.identification.nickname : 'Unregistered'}
          </span>
        </div>
        <span className="text-xs text-grey-1 truncate">{user.id}</span>
      </div>

      {/* Rank badge */}
      {hasData && user.rating && <RankBadge league={user.rating.league} />}

      {!hasData && <span className="text-xs text-grey-1-5 italic shrink-0">No data</span>}
    </button>
  )
}

function RankBadge({ league }: { league: League }) {
  const info = leaguesMap[league]
  return (
    <Tooltip text={info.name}>
      <img className="size-7 drop-shadow-lg shrink-0" alt={info.name} src={info.icon} />
    </Tooltip>
  )
}

function AccountDetail({ user }: { user: Admin.ListAccountsResultItem }) {
  const hasData = user.userRow !== null

  return (
    <div className="space-y-5">
      {/* Identity */}
      <Section title="Identity">
        <Field label="Auth ID" value={user.id} mono />
        {hasData && (
          <>
            <Field label="Nickname" value={user.userRow.identification.nickname} />
            <Field label="Slug" value={user.userRow.identification.unique_id} mono />
            <Field label="Role" value={user.userRow.role} />
          </>
        )}
        {!hasData && <p className="text-grey-1 text-sm italic">User has not registered yet.</p>}
      </Section>

      {hasData && (
        <>
          {/* Rating */}
          <Section title="Rating">
            <div className="flex items-center gap-3 mb-2">
              <img
                className="size-10 drop-shadow-lg"
                alt={leaguesMap[user.rating.league].name}
                src={leaguesMap[user.rating.league].icon}
              />
              <div>
                <p className="font-serif font-bold text-gold-1">
                  {leaguesMap[user.rating.league].name}
                  {user.rating.division ? ` ${divisionMap[user.rating.division]}` : ''}
                </p>
                {user.rating.points !== null && (
                  <p className="text-xs text-grey-1">{user.rating.points} LP</p>
                )}
              </div>
            </div>
          </Section>

          {/* Elo */}
          <Section title="Elo">
            <Field label="Score" value={user.userRow.elo.score.toFixed(1)} />
            <Field label="K-Factor" value={String(user.userRow.elo.k)} />
            <Field label="Ranked Matches" value={String(user.userRow.elo.matches)} />
            <Field label="Challenger" value={user.userRow.elo.challenger ? 'Yes' : 'No'} />
          </Section>

          {/* Stats */}
          <Section title="Match Stats">
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatBox label="Wins" value={user.userRow.stats.wins} color="text-green-400" />
              <StatBox label="Draws" value={user.userRow.stats.draws} color="text-grey-1" />
              <StatBox label="Losses" value={user.userRow.stats.defeats} color="text-red-400" />
            </div>
          </Section>

          {/* Economy */}
          <Section title="Economy">
            <Field label="Experience" value={String(user.userRow.experience)} />
            <Field label="Magic Points" value={String(user.userRow.magic_points)} />
            <Field label="Perfect Squares" value={String(user.userRow.perfect_squares)} />
          </Section>

          {/* Profile link */}
          <Link
            className="block text-center text-sm text-gold-3 hover:text-gold-1 underline underline-offset-4 transition-colors"
            to="/users/$nickname"
            params={{ nickname: user.userRow.identification.unique_id }}
          >
            View public profile
          </Link>
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-serif font-bold text-sm text-gold-4 uppercase tracking-wider border-b border-gold-5/40 pb-1 mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2 py-0.5">
      <span className="text-xs text-grey-1 uppercase tracking-wider shrink-0">{label}</span>
      <span className={cn('text-sm text-gold-1 text-right truncate', mono && 'font-mono text-xs')}>
        {value}
      </span>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-hextech-black/40 rounded p-2 border border-gold-5/20">
      <p className={cn('text-lg font-bold font-serif', color)}>{value}</p>
      <p className="text-xs text-grey-1 uppercase">{label}</p>
    </div>
  )
}
