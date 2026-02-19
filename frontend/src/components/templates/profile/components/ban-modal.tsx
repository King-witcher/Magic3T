import { GetUserResult } from '@magic3t/api-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GiHandcuffs } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDialogStore } from '@/contexts/modal-store'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'
import { useState } from 'react'

interface BanModalProps {
  user: GetUserResult
}

const DURATION_OPTIONS = [
  { label: 'Permanente', value: null },
  { label: '1 hora', value: 3600 },
  { label: '1 dia', value: 86400 },
  { label: '7 dias', value: 604800 },
  { label: '30 dias', value: 2592000 },
  { label: 'Personalizado', value: 'custom' as const },
]

export function BanModal({ user }: BanModalProps) {
  const closeModal = useDialogStore((s) => s.closeModal)
  const queryClient = useQueryClient()

  const [reason, setReason] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<number | null | 'custom'>(null)
  const [customDays, setCustomDays] = useState('')
  const [reasonError, setReasonError] = useState(false)

  const banMutation = useMutation({
    async mutationFn() {
      let duration: number | null = null
      if (selectedDuration === 'custom') {
        const days = Number.parseFloat(customDays)
        duration = Math.round(days * 86400)
      } else {
        duration = selectedDuration
      }
      await apiClient.admin.banUser(user.id, { reason: reason.trim(), duration })
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['user-by-nickname'] })
      queryClient.invalidateQueries({ queryKey: ['user-by-id', user.id] })
      closeModal()
    },
  })

  const handleBan = () => {
    if (!reason.trim()) {
      setReasonError(true)
      return
    }
    banMutation.mutate()
  }

  const durationLabel =
    selectedDuration === null
      ? 'permanentemente'
      : selectedDuration === 'custom'
        ? `por ${customDays || '?'} dia(s)`
        : DURATION_OPTIONS.find((o) => o.value === selectedDuration)?.label.toLowerCase()

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-6 p-8 min-w-80 w-full max-w-md',
        'rounded-lg border-2 border-gold-5/50',
        'bg-linear-to-b from-grey-3/85 to-grey-3/75',
        'backdrop-blur-xl shadow-2xl'
      )}
    >
      {/* Decorative corners */}
      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-gold-5/60" />
      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-gold-5/60" />
      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-gold-5/60" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-gold-5/60" />

      <GiHandcuffs size={52} className="text-gold-4" />

      <h2 className="font-serif font-bold text-2xl text-gold-1 uppercase tracking-wider">
        Banir Usuário
      </h2>

      <p className="text-grey-1 text-center text-sm">
        Você está prestes a banir{' '}
        <span className="text-gold-2 font-semibold">{user.nickname}</span>{' '}
        {durationLabel}.
      </p>

      {/* Reason */}
      <div className="w-full space-y-2">
        <Label htmlFor="ban-reason" className="text-gold-3 text-sm font-semibold">
          Motivo *
        </Label>
        <Input
          id="ban-reason"
          placeholder="Informe o motivo do banimento..."
          value={reason}
          error={reasonError}
          onChange={(e) => {
            setReason(e.target.value)
            if (reasonError) setReasonError(false)
          }}
        />
        {reasonError && (
          <p className="text-red-400 text-xs">O motivo é obrigatório.</p>
        )}
      </div>

      {/* Duration */}
      <div className="w-full space-y-2">
        <Label className="text-gold-3 text-sm font-semibold">Duração</Label>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setSelectedDuration(opt.value)}
              className={cn(
                'px-3 py-2 rounded border-2 text-sm font-semibold transition-all duration-200',
                selectedDuration === opt.value
                  ? 'border-gold-4 bg-gold-6/30 text-gold-1'
                  : 'border-grey-1/20 bg-hextech-black/40 text-grey-1 hover:border-grey-1/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {selectedDuration === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              min={1}
              placeholder="Número de dias"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="flex-1"
            />
            <span className="text-grey-1 text-sm whitespace-nowrap">dias</span>
          </div>
        )}
      </div>

      {banMutation.isError && (
        <p className="text-red-400 text-sm text-center">
          Ocorreu um erro ao banir o usuário. Tente novamente.
        </p>
      )}

      <div className="flex gap-4 w-full pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={closeModal}
          className="flex-1"
          disabled={banMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          size="md"
          onClick={handleBan}
          className="flex-1"
          disabled={banMutation.isPending}
        >
          {banMutation.isPending ? 'Banindo...' : 'Banir'}
        </Button>
      </div>
    </div>
  )
}
