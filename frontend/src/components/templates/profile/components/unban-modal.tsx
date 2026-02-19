import { GetUserResult } from '@magic3t/api-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { GiBreakingChain } from 'react-icons/gi'
import { Button } from '@/components/atoms'
import { useDialogStore } from '@/contexts/modal-store'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/clients/api-client'

interface UnbanModalProps {
  user: GetUserResult
}

export function UnbanModal({ user }: UnbanModalProps) {
  const closeModal = useDialogStore((s) => s.closeModal)
  const queryClient = useQueryClient()

  const unbanMutation = useMutation({
    async mutationFn() {
      await apiClient.admin.unbanUser(user.id)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['user-by-nickname'] })
      queryClient.invalidateQueries({ queryKey: ['user-by-id', user.id] })
      closeModal()
    },
  })

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

      <GiBreakingChain size={52} className="text-gold-4" />

      <h2 className="font-serif font-bold text-2xl text-gold-1 uppercase tracking-wider">
        Desbanir Usuário
      </h2>

      <p className="text-grey-1 text-center">
        Tem certeza que deseja remover o banimento de{' '}
        <span className="text-gold-2 font-semibold">{user.nickname}</span>?
      </p>

      {user.ban && (
        <div className="w-full rounded border border-gold-6/30 bg-hextech-black/40 px-4 py-3 text-sm space-y-1">
          <p className="text-grey-1">
            <span className="text-gold-3">Motivo:</span> {user.ban.reason}
          </p>
          <p className="text-grey-1">
            <span className="text-gold-3">Expira em:</span>{' '}
            {user.ban.expiresAt
              ? new Date(user.ban.expiresAt).toLocaleString('pt-BR')
              : 'Nunca (permanente)'}
          </p>
        </div>
      )}

      {unbanMutation.isError && (
        <p className="text-red-400 text-sm text-center">
          Ocorreu um erro ao desbanir o usuário. Tente novamente.
        </p>
      )}

      <div className="flex gap-4 w-full pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={closeModal}
          className="flex-1"
          disabled={unbanMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => unbanMutation.mutate()}
          className="flex-1"
          disabled={unbanMutation.isPending}
        >
          {unbanMutation.isPending ? 'Desbanindo...' : 'Desbanir'}
        </Button>
      </div>
    </div>
  )
}
