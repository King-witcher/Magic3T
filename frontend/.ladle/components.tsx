import '../src/main.css'
import '../src/styles/fonts.sass'
import { GlobalProvider } from '@ladle/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const BACKGROUND_URL = `${import.meta.env.VITE_CDN_URL}/ui/background.png`

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

export const Provider: GlobalProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <div className="w-full h-dvh max-h-full relative overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
      />

      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 size-120 bg-blue-4 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 size-140 bg-gold-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Animated hex pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwIDFMMSAzMGwyOSAyOSAyOS0yOUwzMCAxeiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzhBQTZFIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />

      <main className="flex items-center justify-center relative w-full h-full overflow-hidden">
        {children}
      </main>
    </div>
  </QueryClientProvider>
)
