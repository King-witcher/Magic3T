import type { ReactNode } from 'react'
import { ConsoleTab, Navbar } from '@/components/organisms'
import { useAuth } from '@/contexts/auth/auth-context'
import { ModalLayout } from './modal-layout'

const BACKGROUND_URL = `${import.meta.env.VITE_CDN_URL}/ui/background.png`

interface Props {
  children: ReactNode
}

export function RootLayout({ children }: Props) {
  const auth = useAuth()

  return (
    <>
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
      />

      <div className="flex flex-col items-center h-dvh relative">
        {auth.signedIn && <Navbar />}
        <main className="flex-1 relative w-full h-full overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 size-120 bg-blue-4 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 size-140 bg-gold-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Animated hex pattern overlay */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwIDFMMSAzMGwyOSAyOSAyOS0yOUwzMCAxeiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzhBQTZFIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />

          {/* Scroll Area */}
          <div className="absolute inset-0 overflow-x-hidden overflow-y-scroll">
            {/* Page width limiter */}
            {children}
            {/* <div className="flex p-7.5 sm:p-[40px_100px] h-fit min-h-full w-full justify-center relative">
              <div className="w-full max-w-350">{children}</div>
            </div> */}
          </div>
        </main>
      </div>

      <ModalLayout />
      <ConsoleTab />
    </>
  )
}
