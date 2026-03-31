import { GetUserResult, ListMatchesResult } from '@magic3t/api-types'
import { UseQueryResult } from '@tanstack/react-query'
import { Panel } from '@/components/ui/panel'
import { useRegisterCommand } from '@/hooks/use-register-command'
import { Console } from '@/lib/console'
import { MatchHistory } from './components/match-history'
import { ProfileHeader } from './components/profile-header'
import { ProfileSearch } from './components/profile-search'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { banUser, BanUserPayload } from '@/services/clients/ban-user'
import { ProfileStats } from './components/profile-stats'

interface Props {
  user: GetUserResult
  matchesQuery: UseQueryResult<ListMatchesResult, Error>
}

export function ProfileTemplate({ user, matchesQuery }: Props) {
  const auth = useAuth()
  const [banOpen, setBanOpen] = useState(false)
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('permanent')
  const [reason, setReason] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isCreator = auth.user?.role === 'creator'
  const isSelf = auth.user?.id === user.id
  const canBan = isCreator && !isSelf && user.role !== 'creator' && !user.ban

  async function handleBan() {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: BanUserPayload = { type: banType, reason }
      if (banType === 'temporary') payload.expiresAt = expiresAt
      await banUser(user.id, payload)
      setSuccess(true)
      setBanOpen(false)
    } catch (e: any) {
      setError(e?.message || 'Erro ao banir usuário')
    } finally {
      setLoading(false)
    }
  }
  // Registers a console command to log the user ID
  useRegisterCommand(
    {
      name: 'userid',
      description: 'Logs the user ID',
      handler: async () => {
        Console.log(user.id)
        return 0
      },
    },
    [user.id]
  )

  return (
    <div className="min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-6">
        {/* Main Profile Card */}
        <Panel className="flex flex-col gap-4">
          <ProfileHeader user={user} />
          <ProfileStats user={user} />
          <ProfileSearch />
          {canBan && (
            <div className="flex flex-col items-end">
              <Dialog open={banOpen} onOpenChange={setBanOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Banir usuário</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Banir usuário</DialogTitle>
                    <DialogDescription>
                      Escolha o tipo de banimento e, se temporário, defina a data de expiração.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 mt-2">
                    <label className="flex gap-2 items-center">
                      <input type="radio" checked={banType === 'permanent'} onChange={() => setBanType('permanent')} /> Permanente
                    </label>
                    <label className="flex gap-2 items-center">
                      <input type="radio" checked={banType === 'temporary'} onChange={() => setBanType('temporary')} /> Temporário
                    </label>
                    {banType === 'temporary' && (
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        placeholder="Data/hora de expiração"
                      />
                    )}
                    <Input
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Motivo (opcional)"
                    />
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {success && <div className="text-green-500 text-sm">Usuário banido com sucesso!</div>}
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleBan} disabled={loading}>
                      {loading ? 'Banindo...' : 'Confirmar Banimento'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </Panel>

        {/* Match History Card */}
        <Panel>
          <MatchHistory matchesQuery={matchesQuery} currentUserId={user.id} />
        </Panel>
      </div>
    </div>
  )
}
