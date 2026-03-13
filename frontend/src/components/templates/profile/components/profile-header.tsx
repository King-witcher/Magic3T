import { GetUserResult } from '@magic3t/api-types'
import { UserDocumentRole } from '@magic3t/database-types'
import { useState } from 'react'
import { GiCrown, GiRobotGrab } from 'react-icons/gi'
import { Tooltip } from '@/components/ui/tooltip'
import { useSignedAuth } from '@/contexts/auth/auth-context'
import { EditAvatarOverlay } from './edit-avatar-overlay'
import { EditIconModal } from './edit-icon-modal'
import {
  AvatarDivision,
  AvatarImage,
  AvatarRoot,
  AvatarWing,
  AvatarWingAnimation,
} from './profile-avatar'

interface ProfileHeaderProps {
  user: GetUserResult
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const session = useSignedAuth()
  const isOwnProfile = session.uuid === user.uuid
  const [editIconOpen, setEditIconOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-6">
        {/* Profile Avatar */}
        <AvatarRoot className="mt-24">
          <AvatarWingAnimation league={user.rank.league} />
          <AvatarImage icon={user.summonerIcon} />
          {isOwnProfile && <EditAvatarOverlay onClick={() => setEditIconOpen(true)} />}
          <AvatarWing league={user.rank.league} type="wing" />
          {user.rank.division && <AvatarDivision division={user.rank.division} />}
        </AvatarRoot>

        {/* User Info */}
        <div className="text-center mt-4 space-y-2">
          {/* Nickname with Role Badge */}
          <div className="flex items-center justify-center gap-2">
            {user.role === UserDocumentRole.Bot && (
              <Tooltip text="Bot account">
                <GiRobotGrab className="text-gold-4 size-7" />
              </Tooltip>
            )}
            {user.role === 'superuser' && (
              <Tooltip text="Game Creator">
                <GiCrown className="text-gold-4 size-7" />
              </Tooltip>
            )}
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gold-1 tracking-wide">
              {user.nickname}
            </h1>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <EditIconModal
          currentIcon={user.summonerIcon}
          open={editIconOpen}
          onOpenChange={setEditIconOpen}
        />
      )}
    </div>
  )
}
