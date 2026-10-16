import { Link } from '@tanstack/react-router'
import { MdDangerous } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { ErrorPanel } from '@/components/ui/error-panel'

export function GlobalErrorTemplate() {

  return (
    <div className="flex items-center justify-center min-h-dvh bg-hextech-black p-4">
      <ErrorPanel className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Error Icon */}
          <div className="relative">
            <MdDangerous className="text-red-500" size={120} />
            <div className="absolute inset-0 blur-2xl bg-red-500/30 -z-10" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl md:text-4xl text-red-400 uppercase tracking-wide">
              Application Crashed
            </h1>
            <div className="h-0.5 w-32 mx-auto bg-linear-to-r from-transparent via-red-500/60 to-transparent" />
          </div>

          {/* Description */}
          <p className="font-sans text-base md:text-lg text-grey-1 max-w-md">
            A bug prevented Magic3T from displaying this page. Our team has been automatically
            notified and will investigate the issue.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button variant="outline" size="md" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button variant="primary" size="md">
              <Link to="/">Return to Home</Link>
            </Button>
          </div>

          {/* Footer hint */}
          <p className="font-sans text-sm text-grey-1/70 mt-4">
            If this problem persists, please contact support
          </p>
        </div>
      </ErrorPanel>
    </div>
  )
}
