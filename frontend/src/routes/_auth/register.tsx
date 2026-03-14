import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { RiGoogleFill } from 'react-icons/ri'
import { toast } from 'sonner'
import z from 'zod'
import { Button, Input, Spinner } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { Tooltip } from '@/components/ui/tooltip'
import { AuthError, AuthState, useAuth } from '@/contexts/auth'
import { ERROR_MAP } from './-error-map'
import { NICKNAME_SCHEMA, PASSWORD_SCHEMA, USERNAME_SCHEMA } from './-validation'

export const Route = createFileRoute('/_auth/register')({
  component: RouteComponent,
})

const schema = z
  .object({
    username: USERNAME_SCHEMA,
    nickname: NICKNAME_SCHEMA,
    password: PASSWORD_SCHEMA,
    check_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.check_password, {
    error: 'Passwords do not match',
    path: ['check_password'],
  })

type FormData = z.infer<typeof schema>

function RouteComponent() {
  const auth = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const registerMutation = useMutation({
    mutationKey: ['register'],
    async mutationFn({ username, nickname, password }: FormData) {
      if (auth.state !== AuthState.NotSignedIn) return
      await auth.register({ username, nickname, password })
    },
    onSuccess() {
      toast.success('Welcome to Magic3T!')
    },
  })

  const loginWithGoogleMutation = useMutation<void, AuthError>({
    mutationKey: ['login-with-google'],
    async mutationFn() {
      if (auth.state !== AuthState.NotSignedIn) return
      await auth.loginWithGoogle()
    },
  })

  function registrer(data: FormData) {
    registerMutation.mutate(data)
  }

  const pending = loginWithGoogleMutation.isPending || registerMutation.isPending

  const credentialsErrorCode = registerMutation.isError ? registerMutation.error.name : null
  const credentialsErrorMessage = credentialsErrorCode
    ? ERROR_MAP[credentialsErrorCode as keyof typeof ERROR_MAP]
    : null

  const oAuthErrorCode = loginWithGoogleMutation.isError ? loginWithGoogleMutation.error.name : null
  const oAuthErrorMessage = oAuthErrorCode
    ? ERROR_MAP[oAuthErrorCode as keyof typeof ERROR_MAP]
    : null

  return (
    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(registrer)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif font-bold text-4xl text-gold-4 uppercase tracking-wide">
          Register
        </h2>
        <p className="text-grey-1 text-sm mt-2">
          Already have an account?{' '}
          <Link
            to="/log-in"
            className="text-gold-3 hover:text-gold-1 font-semibold transition-colors duration-200"
            search={(prev) => ({ referrer: prev.referrer })}
          >
            Log in
          </Link>
        </p>
      </div>

      {/* Username Input */}
      <div className="space-y-2">
        <Label className="flex gap-1 items-center">
          Username
          <Tooltip text="This will only be used to log in.">
            <HelpCircle className="size-4 text-gold-3" />
          </Tooltip>
        </Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          disabled={pending}
          error={!!errors.username}
          {...register('username', { required: true })}
        />
        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
      </div>

      {/* Nickname Input */}
      <div className="space-y-2">
        <Label className="flex gap-1 items-center">
          Nickname
          <Tooltip text="This is the name that will be displayed to other users.">
            <HelpCircle className="size-4 text-gold-3" />
          </Tooltip>
        </Label>
        <Input
          id="nickname"
          type="text"
          placeholder="Enter your nickname"
          disabled={pending}
          error={!!errors.nickname}
          {...register('nickname', { required: true })}
        />
        {errors.nickname && <p className="text-red-400 text-xs mt-1">{errors.nickname.message}</p>}
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          disabled={pending}
          error={!!errors.password}
          {...register('password', { required: true })}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          id="check_password"
          type="password"
          placeholder="Confirm your password"
          disabled={pending}
          error={!!errors.check_password}
          {...register('check_password', { required: true })}
        />
        {errors.check_password && (
          <p className="text-red-400 text-xs mt-1">{errors.check_password.message}</p>
        )}
      </div>

      {/* Error Message */}
      {credentialsErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{credentialsErrorMessage}</p>
        </div>
      )}

      {/* Register Button */}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {registerMutation.isPending ? (
          <>
            <Spinner className="size-5" />
            <span>Creating account...</span>
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-grey-1/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-grey-3/90 text-grey-1 uppercase tracking-wider">or</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={() => loginWithGoogleMutation.mutate()}
        disabled={pending}
        className="w-full"
      >
        {loginWithGoogleMutation.isPending && <Spinner className="size-5" />}
        <RiGoogleFill size={24} />
        <span>{loginWithGoogleMutation.isPending ? 'Logging in...' : 'Log in with Google'}</span>
      </Button>

      {/* Error Message */}
      {oAuthErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{oAuthErrorMessage}</p>
        </div>
      )}
    </form>
  )
}
