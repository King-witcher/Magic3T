import { BanUserResponse } from '@magic3t/api-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { Button } from '@/components/atoms'
import { apiClient } from '@/services/clients/api-client'
import styles from './bans-list.module.sass'

export function BansList() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>('')

  const { data: bansResult, isLoading } = useQuery({
    queryKey: ['admin', 'bans'],
    queryFn: async () => {
      try {
        return await apiClient.admin.listActiveBans()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar bans')
        throw err
      }
    },
  })

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.admin.unbanUser(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bans'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao desbanir usuário')
    },
  })

  if (isLoading) {
    return <div className={styles.loading}>Carregando bans...</div>
  }

  const bans = bansResult?.data || []

  return (
    <div className={styles.container}>
      <h2>Banimentos Ativos</h2>

      {error && <div className={styles.error}>{error}</div>}

      {bans.length === 0 ? (
        <div className={styles.empty}>Nenhum usuário banido no momento</div>
      ) : (
        <div className={styles.list}>
          {bans.map((ban) => (
            <div key={ban.userId} className={styles.banItem}>
              <div className={styles.banInfo}>
                <div className={styles.userInfo}>
                  <h3>{ban.nickname}</h3>
                  <p className={styles.userId}>{ban.userId}</p>
                </div>
                <div className={styles.banDetails}>
                  <span className={styles.type}>
                    {ban.isPermanent ? '🔴 Permanente' : '⏱️ Temporário'}
                  </span>
                  {ban.expiresAt && (
                    <span className={styles.expires}>
                      Expira: {new Date(ban.expiresAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <p className={styles.reason}>Motivo: {ban.reason}</p>
                </div>
              </div>
              <button
                className={styles.unbanButton}
                onClick={() => unbanMutation.mutate(ban.userId)}
                disabled={unbanMutation.isPending}
                title="Desbanir"
              >
                <MdDelete size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
