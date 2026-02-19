import { createFileRoute } from '@tanstack/react-router'
import { BanUserModal, BansList } from '@/components/organisms'
import { useUser } from '@/contexts/auth-context'
import { useDialogStore } from '@/contexts/modal-store'
import { Button } from '@/components/atoms'
import styles from './admin.module.sass'

export const Route = createFileRoute('/_auth-guarded/admin')({
  component: () => {
    const user = useUser()
    const showDialog = useDialogStore((state) => state.showDialog)

    if (!user) throw new Error('User not found')

    if (user.role !== 'creator') {
      return (
        <div className={styles.container}>
          <h1>Acesso Negado</h1>
          <p>Apenas criadores podem acessar a zona de administração.</p>
        </div>
      )
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Zona de Administração</h1>
          <Button variant="primary" onClick={() => showDialog(<BanUserModal />)}>
            + Banir Usuário
          </Button>
        </div>

        <BansList />
      </div>
    )
  },
})
