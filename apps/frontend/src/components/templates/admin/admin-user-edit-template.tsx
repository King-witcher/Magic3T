import { Admin } from '@magic3t/api-types'
import { ClientRank, Division, League, UserRole } from '@magic3t/common-types'
import { Link } from '@tanstack/react-router'
import { ComponentProps, ReactNode, useMemo, useState } from 'react'
import { GiCrown } from 'react-icons/gi'
import { IoArrowBack, IoCopyOutline } from 'react-icons/io5'
import { LuPencil } from 'react-icons/lu'
import { toast } from 'sonner'
import { Button, Input, Panel } from '@/components/ui'
import { useAuth } from '@/contexts/auth/auth-context'
import { useClientMutation } from '@/hooks/use-client-mutation'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'
import { ClientError } from '@/services/clients/client-error'
import { getGameIconUrl } from '@/utils/utils'
import { formatDateTime, RankBadge, RoleBadge } from './admin-shared'
import { IconPickerModal } from './icon-picker'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'player', label: 'Player' },
  { value: 'bot', label: 'Bot' },
  { value: 'admin', label: 'Admin' },
  { value: 'superuser', label: 'Super User' },
]

const LEAGUE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Unranked' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'master', label: 'Master' },
  { value: 'challenger', label: 'Challenger' },
]

const DIVISION_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'I' },
  { value: 2, label: 'II' },
  { value: 3, label: 'III' },
  { value: 4, label: 'IV' },
]

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'rank', label: 'Rank' },
  { id: 'economy', label: 'Economia & Stats' },
] as const

type TabId = (typeof TABS)[number]['id']

const ERROR_MESSAGES: Record<string, string> = {
  NicknameUnavailable: 'Este nickname já está em uso.',
  ForbiddenRoleChange: 'Apenas o criador pode alterar o cargo.',
  ValidationError: 'Há campos inválidos. Revise os dados e tente novamente.',
  NoFieldsToUpdate: 'Nenhuma alteração para salvar.',
  'user-not-found': 'Usuário não encontrado.',
}

type FormState = {
  nickname: string
  summonerIcon: number
  role: UserRole
  rank: ClientRank
  credits: number
  xp: number
  wins: number
  draws: number
  defeats: number
}

function isApex(league: League | null): boolean {
  return league === 'master' || league === 'challenger'
}

/** Coerces a rank into a shape accepted by the backend (mirrors the DB constraint). */
function normalizeRank(
  league: League | null,
  division: Division | null,
  lp: number | null
): ClientRank {
  if (league === null) return { league: null, division: null, lp: null }
  if (isApex(league)) return { league, division: null, lp: Math.max(0, lp ?? 0) }
  return {
    league,
    division: (division ?? 1) as Division,
    lp: Math.min(99, Math.max(0, lp ?? 0)),
  }
}

function initForm(user: Admin.AdminUserDetail): FormState {
  return {
    nickname: user.nickname,
    summonerIcon: user.summonerIcon,
    role: user.role,
    rank: { ...user.rank },
    credits: user.credits,
    xp: user.xp,
    wins: user.stats.wins,
    draws: user.stats.draws,
    defeats: user.stats.defeats,
  }
}

/** Builds a patch with only the fields that actually changed. */
function buildCommand(
  form: FormState,
  user: Admin.AdminUserDetail,
  canEditRole: boolean
): Admin.UpdateUserCommand {
  const command: Admin.UpdateUserCommand = {}

  if (form.nickname.trim() !== user.nickname) command.nickname = form.nickname.trim()
  if (form.summonerIcon !== user.summonerIcon) command.summonerIcon = form.summonerIcon
  if (canEditRole && form.role !== user.role) command.role = form.role

  const rankChanged =
    form.rank.league !== user.rank.league ||
    form.rank.division !== user.rank.division ||
    form.rank.lp !== user.rank.lp
  if (rankChanged) command.rank = form.rank

  if (form.credits !== user.credits) command.credits = form.credits
  if (form.xp !== user.xp) command.xp = form.xp

  if (
    form.wins !== user.stats.wins ||
    form.draws !== user.stats.draws ||
    form.defeats !== user.stats.defeats
  ) {
    command.stats = { wins: form.wins, draws: form.draws, defeats: form.defeats }
  }

  return command
}

interface Props {
  user: Admin.AdminUserDetail
  onSaved?: (updated: Admin.AdminUserDetail) => void
}

export function AdminUserEditTemplate({ user, onSaved }: Props) {
  const auth = useAuth()
  const canEditRole = auth.session?.role === 'superuser'

  const [form, setForm] = useState<FormState>(() => initForm(user))
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [iconModalOpen, setIconModalOpen] = useState(false)

  const mutation = useClientMutation(apiClient.admin, 'updateUser', {
    onSuccess: (updated) => {
      toast.success('Usuário atualizado com sucesso.')
      onSaved?.(updated)
    },
    onError: async (error) => {
      const code = error instanceof ClientError ? await error.errorCode : null
      toast.error((code && ERROR_MESSAGES[code]) || 'Não foi possível salvar as alterações.')
    },
  })

  const command = useMemo(() => buildCommand(form, user, canEditRole), [form, user, canEditRole])
  const isDirty = Object.keys(command).length > 0

  const patch = (partial: Partial<FormState>) => setForm((current) => ({ ...current, ...partial }))

  const setRank = (league: League | null, division: Division | null, lp: number | null) =>
    patch({ rank: normalizeRank(league, division, lp) })

  const handleSave = () => {
    if (!isDirty || mutation.isPending) return
    mutation.mutate({ id: user.id, command })
  }

  const copyId = () => {
    navigator.clipboard
      .writeText(user.id)
      .then(() => toast.success('UUID copiado.'))
      .catch(() => toast.error('Não foi possível copiar o UUID.'))
  }

  return (
    <div className="w-full min-h-full p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gold-3 hover:text-gold-1 font-serif uppercase tracking-wider text-sm transition-colors"
        >
          <IoArrowBack className="size-4" />
          Voltar para a lista
        </Link>

        <Panel className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start border-b-2 border-gold-5 pb-6">
            <img
              src={getGameIconUrl(form.summonerIcon)}
              alt=""
              className="size-20 rounded-full border-2 border-gold-4/70 shrink-0"
            />
            <div className="flex flex-col gap-2 items-center sm:items-start min-w-0 w-full">
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-gold-1 tracking-wide">
                  {user.nickname}
                </h1>
                <RoleBadge role={user.role} />
              </div>
              <RankBadge rank={user.rank} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm w-full">
                <InfoRow label="UUID">
                  <button
                    type="button"
                    onClick={copyId}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-gold-2 hover:text-gold-1 transition-colors max-w-full"
                  >
                    <span className="truncate">{user.id}</span>
                    <IoCopyOutline className="size-3.5 shrink-0" />
                  </button>
                </InfoRow>
                <InfoRow label="E-mail">
                  <span className="text-gold-2 truncate">{user.email ?? '—'}</span>
                </InfoRow>
                <InfoRow label="Criado em">
                  <span className="text-gold-2">{formatDateTime(user.createdAt)}</span>
                </InfoRow>
                <InfoRow label="MMR">
                  <span className="text-gold-2">
                    {Math.round(user.mmrScore)} · {user.rankMatches} partidas ranked
                  </span>
                </InfoRow>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gold-6/40">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 font-serif text-sm uppercase tracking-wider transition-colors -mb-px border-b-2',
                  activeTab === tab.id
                    ? 'text-gold-1 border-gold-4'
                    : 'text-grey-1 border-transparent hover:text-gold-2'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-48">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Nickname">
                  <Input
                    value={form.nickname}
                    maxLength={16}
                    onChange={(event) => patch({ nickname: event.target.value })}
                  />
                </Field>
                <Field label="Ícone de invocador">
                  <div className="flex items-center gap-3">
                    <img
                      src={getGameIconUrl(form.summonerIcon)}
                      alt="Ícone atual"
                      className="size-11 shrink-0 rounded border-2 border-gold-5/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIconModalOpen(true)}
                    >
                      <LuPencil className="size-4" />
                      Editar ícone
                    </Button>
                  </div>
                </Field>
                <Field
                  label="Cargo"
                  className="sm:col-span-2"
                  hint={
                    canEditRole
                      ? 'Conceder "Criador" ou "Admin" dá privilégios elevados.'
                      : undefined
                  }
                >
                  {canEditRole ? (
                    <SelectField
                      value={form.role}
                      onChange={(event) => patch({ role: event.target.value as UserRole })}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  ) : (
                    <div className="flex items-center gap-2 h-11 px-3 rounded bg-hextech-black/40 border-2 border-gold-6/30">
                      <RoleBadge role={form.role} />
                      <span className="text-grey-1 text-xs inline-flex items-center gap-1">
                        <GiCrown className="size-3.5" /> Somente o criador pode alterar
                      </span>
                    </div>
                  )}
                </Field>
              </div>
            )}

            {activeTab === 'rank' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field label="Liga">
                  <SelectField
                    value={form.rank.league ?? ''}
                    onChange={(event) =>
                      setRank(
                        (event.target.value || null) as League | null,
                        form.rank.division,
                        form.rank.lp
                      )
                    }
                  >
                    {LEAGUE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </Field>

                <Field
                  label="Divisão"
                  hint={isApex(form.rank.league) ? 'N/A para apex' : undefined}
                >
                  <SelectField
                    value={form.rank.division ?? ''}
                    disabled={form.rank.league === null || isApex(form.rank.league)}
                    onChange={(event) =>
                      setRank(
                        form.rank.league,
                        Number(event.target.value) as Division,
                        form.rank.lp
                      )
                    }
                  >
                    {DIVISION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </Field>

                <Field
                  label="LP"
                  hint={
                    form.rank.league === null
                      ? 'N/A para unranked'
                      : isApex(form.rank.league)
                        ? '≥ 0'
                        : '0 a 99'
                  }
                >
                  <Input
                    type="number"
                    min={0}
                    max={isApex(form.rank.league) ? undefined : 99}
                    disabled={form.rank.league === null}
                    value={form.rank.lp ?? ''}
                    onChange={(event) =>
                      setRank(form.rank.league, form.rank.division, Number(event.target.value) || 0)
                    }
                  />
                </Field>

                <div className="sm:col-span-3 flex items-center gap-3 pt-2">
                  <span className="text-grey-1 text-sm font-serif">Pré-visualização:</span>
                  <RankBadge rank={form.rank} />
                </div>
              </div>
            )}

            {activeTab === 'economy' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Créditos">
                  <NumberInput
                    value={form.credits}
                    onValueChange={(value) => patch({ credits: value })}
                  />
                </Field>
                <Field label="XP">
                  <NumberInput value={form.xp} onValueChange={(value) => patch({ xp: value })} />
                </Field>
                <div className="sm:col-span-2 grid grid-cols-3 gap-4">
                  <Field label="Vitórias">
                    <NumberInput
                      value={form.wins}
                      onValueChange={(value) => patch({ wins: value })}
                    />
                  </Field>
                  <Field label="Empates">
                    <NumberInput
                      value={form.draws}
                      onValueChange={(value) => patch({ draws: value })}
                    />
                  </Field>
                  <Field label="Derrotas">
                    <NumberInput
                      value={form.defeats}
                      onValueChange={(value) => patch({ defeats: value })}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-4 pt-5 border-t border-gold-6/40">
            <span
              className={cn(
                'text-sm font-serif transition-opacity',
                isDirty ? 'text-gold-3 opacity-100' : 'opacity-0'
              )}
            >
              Alterações não salvas
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={!isDirty || mutation.isPending}
                onClick={() => setForm(initForm(user))}
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!isDirty || mutation.isPending}
                onClick={handleSave}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        </Panel>

        <IconPickerModal
          open={iconModalOpen}
          onOpenChange={setIconModalOpen}
          currentIcon={form.summonerIcon}
          ownedIcons={user.ownedIcons}
          onSelect={(iconId) => patch({ summonerIcon: iconId })}
        />
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-grey-1 uppercase text-xs tracking-wider shrink-0">{label}:</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-gold-3 font-serif text-sm uppercase tracking-wider">{label}</span>
      {children}
      {hint && <span className="text-grey-1 text-xs">{hint}</span>}
    </div>
  )
}

function SelectField({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'w-full h-11 px-3 bg-hextech-black/80 border-2 border-gold-6/50 text-gold-1 rounded',
        'focus:outline-none focus:border-gold-4 transition-colors disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function NumberInput({
  value,
  onValueChange,
}: {
  value: number
  onValueChange: (value: number) => void
}) {
  return (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onValueChange(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
    />
  )
}
