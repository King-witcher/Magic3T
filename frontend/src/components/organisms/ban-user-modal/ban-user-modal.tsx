import { BanUserCommand } from '@magic3t/api-types'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms'
import { useDialogStore } from '@/contexts/modal-store'
import { apiClient } from '@/services/clients/api-client'
import { NotFoundError } from '@/services/clients/client-error'
import styles from './ban-user-modal.module.sass'

interface BanUserFormData {
  userId: string
  nickname: string
  isPermanent: boolean
  durationDays?: number
  reason: string
}

export function BanUserModal() {
  const { register, handleSubmit, watch, reset } = useForm<BanUserFormData>({
    defaultValues: {
      isPermanent: true,
      durationDays: 7,
      reason: '',
    },
  })

  const closeModal = useDialogStore((state) => state.closeModal)
  const [error, setError] = useState<string>('')
  const isPermanent = watch('isPermanent')

  const banMutation = useMutation({
    mutationFn: async (data: BanUserFormData) => {
      setError('')

      // Convert days to milliseconds (only for temporary bans)
      const durationMs = !data.isPermanent && data.durationDays ? data.durationDays * 86400000 : undefined

      const command: BanUserCommand = {
        userId: data.userId,
        isPermanent: data.isPermanent,
        durationMs,
        reason: data.reason,
      }

      await apiClient.admin.banUser(command)
    },
    onSuccess: () => {
      reset()
      closeModal()
    },
    onError: (err) => {
      if (err instanceof NotFoundError) {
        setError('Usuário não encontrado')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao banir usuário')
      }
    },
  })

  const onSubmit = useCallback(
    (data: BanUserFormData) => {
      banMutation.mutate(data)
    },
    [banMutation]
  )

  return (
    <div className={styles.container}>
      <h2>Banir Usuário</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="userId">ID do Usuário *</label>
          <input
            id="userId"
            type="text"
            placeholder="ID do usuário a banir"
            {...register('userId', { required: 'ID é obrigatório' })}
            disabled={banMutation.isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="nickname">Nickname (opcional)</label>
          <input
            id="nickname"
            type="text"
            placeholder="Nickname do usuário"
            {...register('nickname')}
            disabled={banMutation.isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={isPermanent}
              {...register('isPermanent')}
              disabled={banMutation.isPending}
            />
            <span>Banimento Permanente</span>
          </label>
        </div>

        {!isPermanent && (
          <div className={styles.formGroup}>
            <label htmlFor="durationDays">Duração (dias) *</label>
            <input
              id="durationDays"
              type="number"
              min="1"
              max="365"
              placeholder="Número de dias"
              {...register('durationDays', {
                required: 'Duração é obrigatória para bans temporários',
                min: 1,
                max: 365,
              })}
              disabled={banMutation.isPending}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="reason">Motivo do Banimento *</label>
          <textarea
            id="reason"
            placeholder="Descreva o motivo do banimento"
            rows={4}
            {...register('reason', {
              required: 'Motivo é obrigatório',
              minLength: { value: 5, message: 'Motivo deve ter pelo menos 5 caracteres' },
            })}
            disabled={banMutation.isPending}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => closeModal()}
            disabled={banMutation.isPending}
          >
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={banMutation.isPending}>
            {banMutation.isPending ? 'Baniando...' : 'Banir Usuário'}
          </Button>
        </div>
      </form>
    </div>
  )
}
