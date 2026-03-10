import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/services/clients/api-client'

interface BanDialogProps {
  userId: string
  nickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onBanSuccess?: () => void
}

type BanType = 'temporary' | 'permanent'

interface DurationPreset {
  label: string
  seconds: number
}

const DURATION_PRESETS: DurationPreset[] = [
  { label: '1 hora', seconds: 3600 },
  { label: '24 horas', seconds: 86400 },
  { label: '7 dias', seconds: 604800 },
  { label: '30 dias', seconds: 2592000 },
]

export function BanDialog({ userId, nickname, open, onOpenChange, onBanSuccess }: BanDialogProps) {
  const [banType, setBanType] = useState<BanType>('temporary')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState<number>(86400) // Default 24 hours
  const [customDuration, setCustomDuration] = useState('')
  const [useCustomDuration, setUseCustomDuration] = useState(false)

  const banMutation = useMutation({
    mutationFn: async () => {
      const finalDuration = useCustomDuration ? Number.parseInt(customDuration, 10) * 3600 : duration
      return apiClient.admin.banUser({
        userId,
        type: banType,
        reason,
        duration: banType === 'temporary' ? finalDuration : undefined,
      })
    },
    onSuccess: () => {
      onOpenChange(false)
      onBanSuccess?.()
      resetForm()
    },
  })

  const resetForm = () => {
    setBanType('temporary')
    setReason('')
    setDuration(86400)
    setCustomDuration('')
    setUseCustomDuration(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    if (banType === 'temporary' && useCustomDuration && !customDuration) return
    banMutation.mutate()
  }

  const isValid =
    reason.trim() &&
    (banType === 'permanent' || !useCustomDuration || (useCustomDuration && customDuration))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Banir Usuário</DialogTitle>
          <DialogDescription>
            Banir <span className="text-gold-3 font-semibold">{nickname}</span> da plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ban Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Banimento</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={banType === 'temporary' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setBanType('temporary')}
              >
                Temporário
              </Button>
              <Button
                type="button"
                variant={banType === 'permanent' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setBanType('permanent')}
              >
                Permanente
              </Button>
            </div>
          </div>

          {/* Duration Selection (only for temporary) */}
          {banType === 'temporary' && (
            <div className="space-y-2">
              <Label>Duração</Label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.seconds}
                    type="button"
                    variant={!useCustomDuration && duration === preset.seconds ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDuration(preset.seconds)
                      setUseCustomDuration(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="custom-duration"
                  checked={useCustomDuration}
                  onChange={(e) => setUseCustomDuration(e.target.checked)}
                  className="accent-gold-4"
                />
                <label htmlFor="custom-duration" className="text-sm text-grey-1">
                  Duração personalizada
                </label>
              </div>
              {useCustomDuration && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Duração"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-grey-1 text-sm">horas</span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Banimento</Label>
            <Input
              id="reason"
              placeholder="Descreva o motivo do banimento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Warning for permanent ban */}
          {banType === 'permanent' && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
              ⚠️ Banimentos permanentes só podem ser revertidos manualmente por um administrador.
            </div>
          )}

          {/* Error display */}
          {banMutation.isError && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
              Erro ao banir usuário. Tente novamente.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={banMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || banMutation.isPending}
            >
              {banMutation.isPending ? 'Banindo...' : 'Confirmar Banimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
