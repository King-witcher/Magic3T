import { Link } from '@tanstack/react-router'
import { GiBrokenShield } from 'react-icons/gi'
import { MdHome } from 'react-icons/md'
import { Button } from '@/components/atoms'
import { Panel } from '@/components/ui/panel'

export function NotFoundTemplate() {
  return (
    <div className="flex items-center justify-center flex-col h-full px-4">
      <Panel className="flex flex-col items-center max-w-150 w-full">
        {/* Icon */}
        <div className="relative mb-6">
          <GiBrokenShield
            size="120px"
            className="text-gold-4 drop-shadow-[0_0_20px_rgba(200,170,110,0.5)]"
          />
          <div className="absolute inset-0 animate-pulse">
            <GiBrokenShield size="120px" className="text-gold-3 opacity-20" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif font-bold text-5xl md:text-6xl text-gold-1 uppercase tracking-wider mb-3 drop-shadow-[0_0_20px_rgba(200,170,110,0.5)] text-center">
          404
        </h1>

        {/* Subtitle */}
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-gold-2 uppercase tracking-wide mb-4 text-center">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-grey-1 text-center text-sm md:text-base mb-8 max-w-100">
          The page you&apos;re looking for has been destroyed, moved, or never existed in the first
          place.
        </p>

        {/* Action Button */}
        <Button variant="primary" size="lg">
          <Link to="/" className="flex gap-4 items-center">
            <MdHome size={20} />
            <span>Return to Home</span>
          </Link>
        </Button>
      </Panel>
    </div>
  )
}
