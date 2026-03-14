import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NotFoundTemplate } from '@/components/templates'
import { useAuth } from '@/contexts/auth/auth-context'

export const Route = createFileRoute('/_auth-guard/_admin_guarded')({
  component: () => {
    const { session } = useAuth()

    if (session?.role !== 'superuser') {
      return <NotFoundTemplate />
    }

    return <Outlet />
  },
})
