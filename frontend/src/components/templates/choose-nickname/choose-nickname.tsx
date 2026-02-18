import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { ChangeEvent, SubmitEvent, useState } from 'react'
import { GiCrystalShine } from 'react-icons/gi'
import { Button, Input } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { Panel, PanelDivider } from '@/components/ui/panel'
import { useSignedAuth } from '@/contexts/auth-context'
import { apiClient } from '@/services/clients/api-client'

export function ChooseNicknameTemplate() {
  const [nickname, setNickname] = useState('')
  const auth = useSignedAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const changeNickMutation = useMutation({
    mutationKey: ['register', nickname],
    async mutationFn() {
      if (nickname.length < 3) throw new Error('nickname must contain at least 3 characters')

      await apiClient.user.register({
        nickname,
      })
    },
    onMutate() {
      setError(null)
    },
    onSuccess() {
      auth.refetchUser()
      router.navigate({ to: '/tutorial' })
    },
    onError(e) {
      setError(e.message.replace(/^(.)/, (match) => match.toUpperCase()))
    },
  })

  function handleChageNickname(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value

    if (value.length > 16) return

    if (!value.match(/^[a-zA-Z0-9áÁâÂãÃàÀäÄéÉêÊèÈëËíÍîÎìÌïÏóÓôÔõÕòÒöÖúÚûÛùÙüÜçÇñÑ\s]*$/)) return

    setNickname(value)
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    changeNickMutation.mutate()
  }

  return (
    <div className="center h-full px-4">
      <Panel className="max-w-150 w-full">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Icon Header */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse">
                <GiCrystalShine size={64} className="text-gold-3 opacity-20" />
              </div>
              <GiCrystalShine
                size={64}
                className="text-gold-3 drop-shadow-[0_0_20px_rgba(200,170,110,0.5)] relative"
              />
            </div>

            <div className="text-center">
              <h1 className="font-serif font-bold text-4xl text-gold-1 uppercase tracking-wider mb-2 drop-shadow-[0_0_20px_rgba(200,170,110,0.5)]">
                Choose Your Name
              </h1>
              <p className="text-grey-1 text-sm max-w-100">
                Your summoner name will be displayed across all corners of the Magic Square. Choose
                wisely.
              </p>
            </div>
          </div>

          {/* Divider */}
          <PanelDivider />

          {/* Nickname Input */}
          <div className="space-y-3">
            <Label htmlFor="nickname" className="text-gold-3 uppercase tracking-wider text-sm">
              Summoner Name
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={handleChageNickname}
              onPaste={(e) => e.preventDefault()}
              disabled={changeNickMutation.isPending}
              spellCheck={false}
              error={!!error}
              className="text-center font-serif text-2xl h-14 tracking-wide"
            />
            <div className="flex justify-between text-xs text-grey-1">
              <span>3-16 characters</span>
              <span className={nickname.length > 16 ? 'text-red-400' : ''}>
                {nickname.length}/16
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-gold-6/10 border border-gold-5/30 rounded px-4 py-3">
            <p className="text-gold-2 text-xs text-center">
              <strong>Warning:</strong> You can only change your nickname again in{' '}
              <strong className="text-gold-1">30 days</strong>
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={changeNickMutation.isPending || nickname.length < 3}
            size="lg"
            className="w-full"
          >
            {changeNickMutation.isPending ? 'Saving...' : 'Confirm Summoner Name'}
          </Button>
        </form>
      </Panel>
    </div>
  )
}
