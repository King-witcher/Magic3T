import { createFileRoute } from '@tanstack/react-router'
import { AdminUsersTemplate } from '@/components/templates/admin'

export const Route = createFileRoute('/_auth-guard/_admin_guarded/admin')({
  component: AdminUsersTemplate,
})
