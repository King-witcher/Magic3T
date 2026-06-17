import { Admin } from '@magic3t/api-types'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { IoSearch } from 'react-icons/io5'
import { Spinner } from '@/components/atoms/spinner'
import { Input, Panel } from '@/components/ui'
import { ErrorPanel } from '@/components/ui/error-panel'
import { useAuth } from '@/contexts/auth/auth-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'
import { getIconUrl } from '@/utils/utils'
import { formatDate, RankBadge, RoleBadge } from './admin-shared'
import { SortControl } from './sort-control'

const PAGE_SIZE = 30

export function AdminUsersTemplate() {
  const auth = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<Admin.ListUsersSort>('createdAt')
  const [order, setOrder] = useState<Admin.ListUsersOrder>('desc')

  const search = useDebouncedValue(searchInput.trim(), 350)

  const query = useInfiniteQuery({
    // Changing any filter (or the session) starts a fresh, independent list.
    queryKey: ['admin', 'listUsers', { search: search || undefined, sort, order }, auth.sessionId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      apiClient.admin.listUsers(
        { search: search || undefined, sort, order, cursor: pageParam, limit: PAGE_SIZE },
        signal
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const users = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  const { lastElementRef } = useInfiniteScroll(
    () => query.fetchNextPage(),
    !!query.hasNextPage && !query.isFetchingNextPage
  )

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-6xl">
        <Panel className="flex flex-col">
          {/* Header */}
          <div className="border-b-2 border-gold-5 pb-5 mb-6">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gold-4 uppercase tracking-wide">
              Admin Panel
            </h1>
            <p className="text-grey-1 text-sm mt-1 uppercase tracking-wider">
              {total > 0 ? `${total} invocadores registrados` : 'Gestão de usuários'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-grey-1/70 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nickname ou UUID..."
                className="pl-10 h-11 py-0"
              />
            </div>
            <SortControl
              sort={sort}
              order={order}
              onSortChange={setSort}
              onOrderChange={setOrder}
            />
          </div>

          {/* Results */}
          {query.isError ? (
            <ErrorPanel>
              <p className="text-red-200 font-serif">Unable do load users: {query.error.message}</p>
            </ErrorPanel>
          ) : query.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-10" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-grey-1 font-serif">
              No users found{search ? ` for "${search}"` : ''}.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}

              {/* Infinite-scroll sentinel + status */}
              <div ref={lastElementRef} className="flex justify-center py-6">
                {query.isFetchingNextPage ? (
                  <Spinner className="size-7" />
                ) : (
                  query.hasNextPage && (
                    <span className="text-grey-1/60 text-sm font-serif">Loading more...</span>
                  )
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function UserRow({ user }: { user: Admin.AdminUserListItem }) {
  return (
    <Link
      to="/admin/users/$userId"
      params={{ userId: user.id }}
      className={cn(
        'group grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 p-3 rounded',
        'bg-linear-to-r from-grey-3/40 to-grey-3/20 border-2 border-gold-5/30',
        'transition-all duration-200',
        'hover:from-gold-5/15 hover:to-gold-5/5 hover:border-gold-4/60 hover:shadow-lg hover:shadow-gold-5/10'
      )}
    >
      {/* Avatar */}
      <img
        src={getIconUrl(user.summonerIcon)}
        alt=""
        className="size-12 rounded-full border-2 border-gold-5/50 group-hover:border-gold-4 transition-colors"
      />

      {/* Identity */}
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gold-1 font-serif font-semibold text-base sm:text-lg truncate">
            {user.nickname}
          </span>
          <RoleBadge role={user.role} />
        </div>
        <div className="flex items-center gap-2 text-xs text-grey-1 font-mono truncate">
          <span className="truncate">{user.email ?? '—'}</span>
          <span className="hidden sm:inline text-grey-1/50">·</span>
          <span className="hidden sm:inline whitespace-nowrap">
            Desde {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {/* Rank */}
      <div className="hidden xs:flex justify-end">
        <RankBadge rank={user.rank} />
      </div>
    </Link>
  )
}
