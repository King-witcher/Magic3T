import { MIN_PASSWORD_SCORE, PasswordScore } from '@magic3t/api-types'
import { cn } from '@/lib/utils'
import type { PasswordStrengthState } from './-use-password-strength'

const SCORE_META: Record<PasswordScore, { label: string; text: string; bar: string }> = {
  0: { label: 'Very weak', text: 'text-red-400', bar: 'bg-red-500' },
  1: { label: 'Weak', text: 'text-orange-400', bar: 'bg-orange-500' },
  2: { label: 'Fair', text: 'text-amber-300', bar: 'bg-amber-400' },
  3: { label: 'Good', text: 'text-lime-400', bar: 'bg-lime-500' },
  4: { label: 'Strong', text: 'text-green-400', bar: 'bg-green-500' },
}

const SEGMENTS = [0, 1, 2, 3, 4] as const

type Props = {
  /** Whether the password field currently has any value. */
  active: boolean
  strength: PasswordStrengthState
}

export function PasswordStrengthMeter({ active, strength }: Props) {
  if (!active) return null

  const { result, isLoading } = strength
  const score = result?.score
  const meta = score !== undefined ? SCORE_META[score] : null
  const warning = result?.feedback.warning
  const suggestion = result?.feedback.suggestions[0]

  return (
    <div className="space-y-1.5" aria-live="polite">
      {/* Segmented strength bar */}
      <div className="flex gap-1">
        {SEGMENTS.map((segment) => (
          <div
            key={segment}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              meta && score !== undefined && segment <= score ? meta.bar : 'bg-grey-2'
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-grey-1">
          {isLoading && score === undefined ? 'Checking strength…' : 'Password strength'}
        </span>
        {meta && (
          <span className={cn('font-semibold', meta.text)}>
            {meta.label}
            {score !== undefined && score < MIN_PASSWORD_SCORE && ' — too weak'}
          </span>
        )}
      </div>

      {/* Feedback to help the user pick a stronger password */}
      {(warning || suggestion) && <p className="text-grey-1 text-xs">{warning || suggestion}</p>}
    </div>
  )
}
