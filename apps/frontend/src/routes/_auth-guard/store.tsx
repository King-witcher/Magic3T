import { createFileRoute } from '@tanstack/react-router'
import { StoreTemplate } from '@/components/templates'

export const Route = createFileRoute('/_auth-guard/store')({
  component: RouteComponent,
})

function RouteComponent() {
  return <StoreTemplate />
}
