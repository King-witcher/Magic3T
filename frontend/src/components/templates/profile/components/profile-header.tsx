import { GetUserResult } from '@magic3t/api-types'
import { UserRole } from '@magic3t/database-types'
import { GiChainedHeart, GiCrown, GiRobotGrab } from 'react-icons/gi'
import { Tooltip } from '@/components/ui/tooltip'
import { AvatarDivision, AvatarImage, AvatarRoot, AvatarWing } from './profile-avatar'

interface ProfileHeaderProps {
  user: GetUserResult
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const isBanned =
    user.ban != null &&
    (user.ban.expiresAt === null || new Date(user.ban.expiresAt) > new Date())

  const banLabel = isBanned
    ? user.ban!.expiresAt === null
      ? `Banido permanentemente: ${user.ban!.reason}`
      : `Banido até ${new Date(user.ban!.expiresAt).toLocaleString('pt-BR')}: ${user.ban!.reason}`
    : ''

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-6">
        {/* Profile Avatar */}
        <AvatarRoot className="mt-24">
          <AvatarImage icon={user.summonerIcon} />
          <AvatarWing league={user.rating.league} type="wing" />
          {user.rating.division && <AvatarDivision division={user.rating.division} />}
        </AvatarRoot>

        {/* User Info */}
        <div className="text-center mt-4 space-y-2">
          {/* Nickname with Role Badge */}
          <div className="flex items-center justify-center gap-2">
            {user.role === UserRole.Bot && (
              <Tooltip text="Bot account">
                <GiRobotGrab className="text-gold-4 size-7" />
              </Tooltip>
            )}
            {user.role === UserRole.Creator && (
              <Tooltip text="Game Creator">
                <GiCrown className="text-gold-4 size-7" />
              </Tooltip>
            )}
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gold-1 tracking-wide">
              {user.nickname}
            </h1>
            {isBanned && (
              <Tooltip text={banLabel}>
                <GiChainedHeart className="text-red-400 size-7" />
              </Tooltip>
            )}
          </div>
          {isBanned && (
            <p className="text-red-400 text-sm font-semibold uppercase tracking-wider">
              {user.ban!.expiresAt === null ? 'Banido permanentemente' : 'Banido temporariamente'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

