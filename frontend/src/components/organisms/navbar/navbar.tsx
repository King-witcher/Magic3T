import { UserRole } from '@magic3t/database-types'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { GiBookCover, GiCrown, GiTargetArrows, GiTrophy } from 'react-icons/gi'
import { IoLogOutOutline, IoPerson } from 'react-icons/io5'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AuthState, useAuth } from '@/contexts/auth-context'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { getIconUrl } from '@/utils/utils'
import { LogoutDialog } from './logout-dialog'
import { NavLink } from './nav-link'

export function Navbar() {
  const { state: authState, user } = useAuth()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleLogout = () => {
    authClient.signOut()
    setLogoutOpen(false)
  }

  return (
    <nav
      className={cn(
        'relative w-full h-17 shrink-0',
        'flex items-center px-4',
        // 'bg-linear-to-r from-gold-5/20 to-gold-6/30',
        'bg-hextech-black/50 backdrop-blur-sm',
        'border-b-2 border-gold-4',
        'shadow-lg shadow-black/40',
        'z-10'
      )}
    >
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-gold-4 to-transparent" />

      {/* Left side - Logo */}
      <Link
        to="/"
        className={cn(
          'relative flex items-center gap-3 px-4 py-2',
          'transition-all duration-300',
          'hover:bg-linear-to-r hover:from-gold-6/30 hover:via-gold-5/20 hover:to-gold-6/30',
          'group overflow-hidden',
          'before:absolute before:inset-0 before:border-2 before:border-gold-4/40',
          'before:transition-all before:duration-300',
          'hover:before:border-gold-4/60 hover:before:shadow-lg hover:before:shadow-gold-5/20',
          // Decorative corners
          'after:absolute after:top-0 after:left-0 after:w-2 after:h-2',
          'after:border-l-2 after:border-t-2 after:border-gold-3/60',
          'after:transition-all after:duration-300',
          'hover:after:w-3 hover:after:h-3 hover:after:border-gold-2',
          'mr-auto'
        )}
      >
        {/* Bottom right corner */}
        <div
          className={cn(
            'absolute bottom-0 right-0 w-2 h-2',
            'border-r-2 border-b-2 border-gold-3/60',
            'transition-all duration-300',
            'group-hover:w-3 group-hover:h-3 group-hover:border-gold-2'
          )}
        />

        {/* Play Magic3T */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'font-serif text-xl text-gold-1/70 uppercase tracking-wide',
              'transition-colors duration-300',
              'group-hover:text-gold-1'
            )}
          >
            Play
          </span>
          <span
            className={cn(
              'font-serif text-xl font-bold text-gold-4 uppercase tracking-wider',
              'transition-all duration-300',
              'group-hover:text-gold-0 group-hover:drop-shadow-[0_0_8px_rgba(245,203,92,0.6)]'
            )}
          >
            Magic3T
          </span>
        </div>

        {/* Shine effect on hover */}
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-r from-transparent via-gold-2/0 to-transparent',
            'transition-all duration-700',
            'group-hover:via-gold-2/20',
            '-translate-x-full group-hover:translate-x-full'
          )}
        />
      </Link>

      {/* Leaderboard */}
      <NavLink href="/leaderboard" tooltip="The best Magic3T players">
        <GiTrophy size={20} />
        <span className="hidden lg:inline-block">Leaderboard</span>
      </NavLink>

      {/* Tutorial */}
      <NavLink href="/tutorial" tooltip="Learn how to play Magic3T" className="hidden xs:flex">
        <GiBookCover size={20} />
        <span className="hidden lg:inline-block">Tutorial</span>
      </NavLink>

      {/* Playground */}
      <NavLink href="/playground" tooltip="Plan your strategies in the playground">
        <GiTargetArrows size={20} />
        <span className="hidden lg:inline-block">Playground</span>
      </NavLink>

      {/* Admin Button */}
      {authState === AuthState.SignedIn && user.role === UserRole.Creator && (
        <NavLink href="/admin" tooltip="Creator Zone" className="hidden md:flex">
          <GiCrown size={20} />
          <span className="hidden lg:inline-block">Admin</span>
        </NavLink>
      )}

      {/* Logout button for unregistered users */}
      {authState === AuthState.SignedInUnregistered && (
        <>
          {/* Divider */}
          <div className="hidden xs:block w-px h-8 bg-gold-6 mx-2" />
          <NavLink
            onClick={() => setLogoutOpen(true)}
            tooltip="Finish session"
            className="hover:animate-out"
          >
            <IoLogOutOutline size={20} />
            <span className="hidden sm:inline-block">Logout</span>
          </NavLink>
        </>
      )}

      {/* Profile button */}
      {authState === AuthState.SignedIn && (
        <>
          {/* Divider */}
          <div className="hidden xs:block w-px h-8 bg-gold-6 mx-2" />
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-2 px-4 h-full',
                  'cursor-pointer select-none',
                  'transition-all duration-200',
                  'hover:bg-blue-4/20'
                )}
              >
                <img
                  alt="icon"
                  src={getIconUrl(user.summonerIcon)}
                  className="size-10 border-gold-7 border"
                />
                <span className="text-gold-1 text-lg font-serif tracking-wide hidden sm:inline-block">
                  {user.nickname}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-2 text-gold-2">
                <Link
                  to="/me"
                  className="flex gap-2 items-center hover:bg-blue-4/20 p-3 cursor-pointer"
                >
                  <IoPerson />
                  My Profile
                </Link>
                {authState === AuthState.SignedIn && user.role === UserRole.Creator && (
                  <Link
                    to={'/admin' as '/'}
                    className="flex gap-2 items-center hover:bg-blue-4/20 p-3 cursor-pointer md:hidden"
                  >
                    <GiCrown />
                    Admin
                  </Link>
                )}
                <Link
                  to="/tutorial"
                  className="flex gap-2 items-center hover:bg-blue-4/20 p-3 cursor-pointer"
                >
                  <GiBookCover />
                  Tutorial
                </Link>
                <button
                  type="button"
                  className="flex gap-2 items-center hover:bg-blue-4/20 p-3 cursor-pointer"
                  onClick={() => setLogoutOpen(true)}
                >
                  <IoLogOutOutline />
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Logout Dialog */}
      <LogoutDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </nav>
  )
}
