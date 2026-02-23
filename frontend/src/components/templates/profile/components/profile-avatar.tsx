import { Division, League } from '@magic3t/common-types'
import { ComponentProps } from 'react'
import { divisionMap, leaguesMap } from '@/utils/ranks'
import { cn, getIconUrl } from '@/utils/utils'

// Wings are in a 287/372 ratio
// Avatar space is 96/287 ~ 1/3 of the image width
// Avatar space starts at 467/992 from the top
// The division text is centered at 230/497 from the top of the image
// The division text is at -3/97 avatar diameters from the top of the avatar space
// Level borders are at scale 683/1265

type AvatarRootProps = ComponentProps<'div'>
export function AvatarRoot({ className, ...props }: AvatarRootProps) {
  return <div className={cn('relative size-32', className)} {...props} />
}

type AvatarImageProps = ComponentProps<'img'> & { icon: number }
export function AvatarImage({ icon, className, ...props }: AvatarImageProps) {
  return (
    <img
      src={getIconUrl(icon)}
      alt={`icon ${icon}`}
      className={cn('rounded-full shadow-lg shadow-gold-5/40 relative', className)}
      {...props}
    />
  )
}

type AvatarWingProps = {
  league: League
  type?: 'wing' | 'plate'
}
export function AvatarWing({ league, type = 'plate' }: AvatarWingProps) {
  const leagueInfo = leaguesMap[league]

  return (
    <div className="absolute inset-0">
      <div
        className={cn(
          'absolute h-auto left-1/2 -translate-x-1/2 ',
          league === League.Provisional
            ? 'top-1/2 w-1264/683 -translate-y-1/2' // Unranked
            : 'w-287/96 -translate-y-467/992' // Ranked
        )}
      >
        <img
          className="w-full h-auto"
          src={type === 'wing' ? leagueInfo.wing : leagueInfo.plate}
          alt={leagueInfo.name}
        />
      </div>
    </div>
  )
}

type AvatarWingAnimationProps = {
  league: League
}
export function AvatarWingAnimation({ league }: AvatarWingAnimationProps) {
  const leagueInfo = leaguesMap[league]

  if (!leagueInfo.animation) return null

  return (
    <div className="absolute inset-0">
      <div
        className={cn(
          'absolute h-auto left-1/2 -translate-x-1/2 ',
          league === League.Provisional
            ? 'top-1/2 w-1264/683 -translate-y-1/2' // Unranked
            : 'w-287/96 -translate-y-467/992' // Ranked
        )}
      >
        <video className="w-full h-auto" src={leagueInfo.animation} autoPlay loop muted />
      </div>
    </div>
  )
}

type AvatarDivisionProps = ComponentProps<'span'> & { division: Division }
export function AvatarDivision({ division, className, ...props }: AvatarDivisionProps) {
  const divisionString = division ? divisionMap[division] : ''
  return (
    <span
      className={cn(
        'absolute left-1/2 -top-3/97 -translate-x-1/2 -translate-y-1/2',
        ' font-serif font-bold text-2xl text-gold-1 tracking-tight',
        className
      )}
      {...props}
    >
      {divisionString}
    </span>
  )
}
