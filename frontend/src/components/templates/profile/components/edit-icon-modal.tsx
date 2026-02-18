import { GetUserResult } from '@magic3t/api-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useSignedAuth } from '@/contexts/auth-context'
import { apiClient } from '@/services/clients/api-client'
import { getIconUrl } from '@/utils/utils'
import { IconGrid } from './icon-grid'

interface EditIconModalProps {
  currentIcon: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditIconModal({ currentIcon, open, onOpenChange }: EditIconModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <EditIconModalInner currentIcon={currentIcon} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type InnerProps = {
  currentIcon: number
  onClose: () => void
}

function EditIconModalInner({ currentIcon, onClose }: InnerProps) {
  const [selectedIcon, setSelectedIcon] = useState(currentIcon)
  const auth = useSignedAuth()
  const queryClient = useQueryClient()

  const iconsQuery = useQuery({
    queryKey: ['my-icons', auth.userId],
    queryFn: () => apiClient.user.getMyIcons(),
    staleTime: 60 * 1000, // 1 minute
  })

  const updateIconMutation = useMutation({
    mutationKey: ['update-icon', selectedIcon],
    async mutationFn(iconId: number) {
      await apiClient.user.updateIcon(iconId)
    },
    onMutate() {
      queryClient.setQueryData(
        ['user-by-id', auth.userId],
        (oldData: GetUserResult | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            summonerIcon: selectedIcon,
          }
        }
      )
      onClose()
    },
    onError() {
      queryClient.invalidateQueries({ queryKey: ['user-by-id', auth.userId] })
    },
  })

  const hasChanged = selectedIcon !== currentIcon
  const isPending = updateIconMutation.isPending

  function handleSave() {
    if (!hasChanged || isPending) return
    updateIconMutation.mutate(selectedIcon)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Icon</DialogTitle>
        <DialogDescription>Choose a new summoner icon for your profile.</DialogDescription>
      </DialogHeader>

      {/* Preview */}
      <div className="flex justify-center py-2">
        <div className="relative">
          <img
            src={getIconUrl(selectedIcon)}
            alt="Selected icon preview"
            className="size-24 rounded-full shadow-lg shadow-gold-5/40 border-2 border-gold-4/60"
          />
        </div>
      </div>

      {/* Icon Grid */}
      {iconsQuery.isPending && (
        <div className="flex justify-center py-8">
          <span className="text-grey-1 text-sm animate-pulse">Loading icons...</span>
        </div>
      )}

      {iconsQuery.isError && (
        <div className="flex justify-center py-8">
          <span className="text-red-400 text-sm">Failed to load icons.</span>
        </div>
      )}

      {iconsQuery.isSuccess && (
        <IconGrid icons={iconsQuery.data} selectedIcon={selectedIcon} onSelect={setSelectedIcon} />
      )}

      {/* Error message */}
      {updateIconMutation.isError && (
        <p className="text-red-400 text-sm text-center">Failed to update icon. Please try again.</p>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!hasChanged || isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </>
  )
}
