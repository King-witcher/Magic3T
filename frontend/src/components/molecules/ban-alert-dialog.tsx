import { MdBlock } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BanErrorMetadata, formatBanExpiration } from '@/lib/ban-utils'

interface BanAlertDialogProps {
  banInfo: BanErrorMetadata
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BanAlertDialog({ banInfo, open, onOpenChange }: BanAlertDialogProps) {
  const isPermanent = banInfo.type === 'permanent'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-900/30 rounded-full">
              <MdBlock className="size-12 text-red-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-red-400">
            Você está banido
          </DialogTitle>
          <DialogDescription className="text-center">
            Sua conta foi {isPermanent ? 'permanentemente' : 'temporariamente'} banida da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason */}
          <div className="p-4 bg-hextech-black/50 border border-grey-1/20 rounded">
            <p className="text-sm text-grey-1 uppercase tracking-wide mb-1">Motivo</p>
            <p className="text-gold-1">{banInfo.reason}</p>
          </div>

          {/* Duration */}
          {!isPermanent && banInfo.expiresAt && (
            <div className="p-4 bg-hextech-black/50 border border-grey-1/20 rounded">
              <p className="text-sm text-grey-1 uppercase tracking-wide mb-1">Tempo restante</p>
              <p className="text-gold-1">{formatBanExpiration(banInfo.expiresAt)}</p>
            </div>
          )}

          {isPermanent && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-sm text-center">
              Este banimento é permanente e só pode ser revertido por um administrador.
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
