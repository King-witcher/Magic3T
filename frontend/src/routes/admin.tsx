import { UserBanType, UserRole } from '@magic3t/database-types'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Button, Input } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { Panel, PanelDivider } from '@/components/ui/panel'
import { ChooseNicknameTemplate, LoadingSessionTemplate, NotFoundTemplate } from '@/components/templates'
import { AuthState, useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/services/clients/api-client'
import { ClientError } from '@/services/clients/client-error'

export const Route = createFileRoute('/admin' as any)({
  component: Page,
})

type BanTypeOption = UserBanType.Temporary | UserBanType.Permanent

type BanFormState = {
  userId: string
  type: BanTypeOption
  durationSeconds: string
  reason: string
}

const ERROR_MAP: Record<string, string> = {
  'cannot-ban-self': 'Você não pode se banir.',
  'user-not-found': 'Usuário não encontrado.',
  'invalid-ban-duration': 'Informe uma duração válida em segundos.',
  unauthorized: 'Você precisa estar autenticado.',
  forbidden: 'Acesso negado.',
}

function Page() {
  const { state: authState, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authState === AuthState.NotSignedIn) {
      navigate({
        to: '/sign-in',
        search: {
          referrer: '/admin',
        },
      })
    }
  }, [authState, navigate])

  if (authState === AuthState.LoadingSession || authState === AuthState.LoadingUserData) {
    return <LoadingSessionTemplate />
  }

  if (authState === AuthState.SignedInUnregistered) {
    return <ChooseNicknameTemplate />
  }

  if (!user || user.role !== UserRole.Creator) {
    return <NotFoundTemplate />
  }

  return <AdminBanPanel />
}

function AdminBanPanel() {
  const [form, setForm] = useState<BanFormState>({
    userId: '',
    type: UserBanType.Temporary,
    durationSeconds: '3600',
    reason: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isTemporary = form.type === UserBanType.Temporary

  const payload = useMemo(() => {
    return {
      type: form.type,
      durationSeconds: isTemporary ? Number(form.durationSeconds) : undefined,
      reason: form.reason?.trim() || undefined,
    }
  }, [form.type, form.durationSeconds, form.reason, isTemporary])

  const banMutation = useMutation({
    mutationKey: ['ban-user', form.userId, payload.type],
    async mutationFn() {
      if (!form.userId.trim()) throw new Error('Informe o ID do usuário.')

      if (isTemporary) {
        const duration = Number(form.durationSeconds)
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('Informe uma duração válida em segundos.')
        }
      }

      await apiClient.admin.banUser(form.userId.trim(), payload)
    },
    onMutate() {
      setError(null)
      setSuccess(null)
    },
    async onError(e) {
      if (e instanceof ClientError) {
        const errorCode = await e.errorCode
        if (errorCode && ERROR_MAP[errorCode]) {
          setError(ERROR_MAP[errorCode])
          return
        }
      }

      setError((e as Error).message)
    },
    onSuccess() {
      setSuccess('Banimento aplicado com sucesso.')
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    banMutation.mutate()
  }

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-3xl">
        <Panel>
          <div className="text-center border-b-2 border-gold-5 pb-6 mb-6">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-gold-4 uppercase tracking-wide">
              Creator Zone
            </h1>
            <p className="text-grey-1 text-sm mt-2 uppercase tracking-wider">
              Banir usuários (temporário ou permanente)
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="userId">ID do usuário</Label>
              <Input
                id="userId"
                type="text"
                placeholder="UID do Firebase"
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                disabled={banMutation.isPending}
                error={!!error}
              />
            </div>

            <PanelDivider />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banType">Tipo de banimento</Label>
                <select
                  id="banType"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as BanTypeOption }))
                  }
                  disabled={banMutation.isPending}
                  className="w-full px-4 py-2 sm:py-3 bg-hextech-black/80 border-2 text-gold-1 placeholder-grey-1/50 rounded border-gold-6/50 focus:outline-none focus:border-gold-4 focus:ring-2 focus:ring-gold-4/20 transition-all duration-200"
                >
                  <option value={UserBanType.Temporary}>Temporário</option>
                  <option value={UserBanType.Permanent}>Permanente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (segundos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="3600"
                  value={form.durationSeconds}
                  onChange={(e) => setForm((prev) => ({ ...prev, durationSeconds: e.target.value }))}
                  disabled={!isTemporary || banMutation.isPending}
                />
                <p className="text-xs text-grey-1">
                  Obrigatório para banimento temporário. Ex.: 3600 = 1 hora.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                disabled={banMutation.isPending}
                rows={3}
                className="w-full px-4 py-2 sm:py-3 bg-hextech-black/80 border-2 text-gold-1 placeholder-grey-1/50 rounded border-gold-6/50 focus:outline-none focus:border-gold-4 focus:ring-2 focus:ring-gold-4/20 transition-all duration-200"
                placeholder="Descreva o motivo do banimento"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded px-4 py-3">
                <p className="text-green-400 text-sm text-center">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={banMutation.isPending}
            >
              {banMutation.isPending ? 'Aplicando banimento...' : 'Aplicar banimento'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
