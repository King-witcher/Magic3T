import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { NotFoundTemplate, RootLayout } from '@/components/templates'
import { Toaster } from '@/components/ui/sonner'
import { GlobalErrorTemplate } from './-global-error'
import { Providers } from './-providers'

export const Route = createRootRoute({
  component: () => (
    <Providers>
      <Toaster />
      <RootLayout>
        <Outlet />
      </RootLayout>
      <Analytics />
      <SpeedInsights />
      <ReactQueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </Providers>
  ),
  notFoundComponent: () => <NotFoundTemplate />,
  errorComponent: GlobalErrorTemplate,
})
