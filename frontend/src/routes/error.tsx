import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/error')({
  component: RouteComponent,
})

function RouteComponent() {
  throw new Error('Test Error: This is a test error for Sentry integration.')
}
