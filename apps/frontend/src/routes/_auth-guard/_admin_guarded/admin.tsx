import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth-guard/_admin_guarded/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth-guard/_admin_guarded/admin"!</div>
}
