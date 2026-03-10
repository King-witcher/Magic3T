import { GetUserResult } from '@magic3t/api-types'
import { UserRole } from '@magic3t/database-types'
import { useState } from 'react'
import { GiCrown, GiRobotGrab } from 'react-icons/gi'
import { MdBlock } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { BanDialog } from './ban-dialog'
import { AvatarDivision, AvatarImage, AvatarRoot, AvatarWing } from './profile-avatar'

interface ProfileHeaderProps {
  user: GetUserResult
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const auth = useAuth()
  const [banDialogOpen, setBanDialogOpen] = useState(false)

  const isCreator = auth.user?.role === UserRole.Creator
  const canBan = isCreator

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
          </div>

          {/* Admin Actions */}
          {canBan && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBanDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <MdBlock className="size-4" />
                Banir Usuário
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Ban Dialog */}
      {canBan && (
        <BanDialog
          userId={user.id}
          nickname={user.nickname}
          open={banDialogOpen}
          onOpenChange={setBanDialogOpen}
        />
      )}
    </div>
  )
}
