// Sentry Instrumentation
import './instrument'

import { RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import './prelude'
import './main.css'
import * as Sentry from '@sentry/react'
import { router } from './router'

console.clear()

const rootElement = document.getElementById('root')!
const reactRoot = createRoot(rootElement, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error('Uncaught error', error, errorInfo.componentStack)
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
})

reactRoot.render(<RouterProvider router={router} />)
