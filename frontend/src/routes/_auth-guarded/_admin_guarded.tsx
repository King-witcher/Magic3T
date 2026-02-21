import { UserRole } from '@magic3t/database-types'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NotFoundTemplate } from '@/components/templates'
import { useAuth } from '@/contexts/auth-context'

export const Route = createFileRoute('/_auth-guarded/_admin_guarded')({
  component: () => {
    const { user } = useAuth()

    if (user?.role !== UserRole.Creator) {
      return <NotFoundTemplate />
    }

    return <Outlet />
  },
})
