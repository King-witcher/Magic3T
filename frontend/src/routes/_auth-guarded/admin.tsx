import { GetUserResult } from '@magic3t/api-types'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { UserManagementCard } from '@/components/organisms/admin/user-management-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/services/clients/api-client'

export const Route = createFileRoute('/_auth-guarded/admin')({
  component: AdminPage,
})

function AdminPage() {
  const auth = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GetUserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Get all users from ranking
  const { data: rankingData } = useQuery({
    queryKey: ['user-ranking'],
    queryFn: () => apiClient.user.getRanking(),
  })

  // Check if user is creator
  const isCreator = auth.user?.role === 'creator'

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-hextech-black flex items-center justify-center p-4">
        <div className="bg-hextech-black/80 border-2 border-red-500/50 rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-grey-1">You need creator permissions to access this page.</p>
        </div>
      </div>
    )
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError(null)

    try {
      // Try to search by nickname first
      const user = await apiClient.user.getByNickname(searchQuery.trim())
      setSearchResults([user])
    } catch (error) {
      // If not found by nickname, try by ID
      try {
        const user = await apiClient.user.getById(searchQuery.trim())
        setSearchResults([user])
      } catch (idError) {
        setSearchError('User not found')
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const displayUsers = searchResults.length > 0 ? searchResults : rankingData?.data || []

  return (
    <div className="min-h-screen bg-hextech-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gold-1 mb-2">Admin Panel</h1>
          <p className="text-grey-1">Manage users and permissions</p>
        </div>

        {/* Search Section */}
        <div className="bg-hextech-black/60 border-2 border-gold-6/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gold-1 mb-4">Search User</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by nickname or user ID..."
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            {searchResults.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearchResults([])
                  setSearchQuery('')
                  setSearchError(null)
                }}
              >
                Clear
              </Button>
            )}
          </form>
          {searchError && (
            <p className="text-red-400 text-sm mt-2">{searchError}</p>
          )}
        </div>

        {/* User List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gold-1">
              {searchResults.length > 0 ? 'Search Results' : 'All Users'}
            </h2>
            <span className="text-grey-1 text-sm">
              {displayUsers.length} user{displayUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {displayUsers.length === 0 ? (
            <div className="bg-hextech-black/40 border border-gold-6/30 rounded-lg p-8 text-center">
              <p className="text-grey-1">No users found</p>
            </div>
          ) : (
            displayUsers.map((user) => (
              <UserManagementCard key={user.id} user={user} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
