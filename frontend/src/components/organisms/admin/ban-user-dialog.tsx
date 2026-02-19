import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/services/clients/api-client'

interface BanUserDialogProps {
  userId: string
  userNickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BanUserDialog({
  userId,
  userNickname,
  open,
  onOpenChange,
  onSuccess,
}: BanUserDialogProps) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('')
  const [isPermanent, setIsPermanent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const banMutation = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) {
        throw new Error('Reason is required')
      }

      const durationMinutes = isPermanent ? undefined : Number.parseInt(duration)
      if (!isPermanent && (!duration || !durationMinutes || Number.isNaN(durationMinutes) || durationMinutes <= 0)) {
        throw new Error('Invalid duration')
      }

      return apiClient.admin.banUser(userId, reason.trim(), durationMinutes)
    },
    onSuccess: () => {
      setReason('')
      setDuration('')
      setIsPermanent(false)
      setError(null)
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    banMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-hextech-black/95 border-2 border-gold-6/50 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gold-1 mb-4">Ban User</h2>
        <p className="text-grey-1 mb-6">
          You are about to ban <span className="text-gold-3 font-semibold">{userNickname}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter ban reason..."
              required
              maxLength={200}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="permanent"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="w-4 h-4 accent-gold-5"
            />
            <Label htmlFor="permanent" className="cursor-pointer">
              Permanent Ban
            </Label>
          </div>

          {!isPermanent && (
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 1440 for 24 hours"
                required={!isPermanent}
                min="1"
              />
              <p className="text-xs text-grey-1/70 mt-1">
                Examples: 60 = 1 hour, 1440 = 24 hours, 10080 = 7 days
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={banMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={banMutation.isPending}
              className="flex-1"
            >
              {banMutation.isPending ? 'Banning...' : 'Ban User'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
