import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { RiGoogleFill } from 'react-icons/ri'
import z from 'zod'
import { Button, Input, Spinner } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { AuthError } from '@/contexts/auth'
import { AuthState, useAuth } from '@/contexts/auth/auth-context'
import { ERROR_MAP } from './-error-map'
import { USERNAME_SCHEMA } from './-validation'

const password = z.string()

const schema = z.object({
  username: USERNAME_SCHEMA,
  password,
})

export const Route = createFileRoute('/_auth/sign-in')({
  component: Page,
})

function Page() {
  const auth = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationKey: ['login'],
    async mutationFn(data: { username: string; password: string }) {
      if (auth.state !== AuthState.NotSignedIn) return
      await auth.login(data.username, data.password)
    },
  })

  const loginWithGoogleMutation = useMutation<void, AuthError>({
    mutationKey: ['login-with-google'],
    async mutationFn() {
      if (auth.state !== AuthState.NotSignedIn) return
      await auth.loginWithGoogle()
    },
  })

  function login(data: { username: string; password: string }) {
    loginMutation.mutate(data)
  }

  const isPending = loginMutation.isPending || loginWithGoogleMutation.isPending

  const credentialErrorCode = loginMutation.isError ? loginMutation.error.name : null

  const oAuthErrorCode = loginWithGoogleMutation.isError ? loginWithGoogleMutation.error.name : null

  const credentialErrorMessage = credentialErrorCode
    ? ERROR_MAP[credentialErrorCode as keyof typeof ERROR_MAP]
    : null

  const oAuthErrorMessage = oAuthErrorCode
    ? ERROR_MAP[oAuthErrorCode as keyof typeof ERROR_MAP]
    : null

  return (
    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(login)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif font-bold text-4xl text-gold-4 uppercase tracking-wide">Login</h2>
        <p className="text-grey-1 text-sm mt-2">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-gold-3 hover:text-gold-1 font-semibold transition-colors duration-200"
            search={(prev) => ({ referrer: prev.referrer })}
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Username Input */}
      <div className="space-y-2">
        <Label htmlFor="username">User name</Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your user name"
          disabled={isPending}
          error={!!errors.username}
          {...register('username', { required: true })}
        />
        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          disabled={isPending}
          error={!!errors.password}
          {...register('password', { required: true })}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">Password is required</p>}
      </div>

      {/* Error Message */}
      {credentialErrorCode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{credentialErrorMessage}</p>
        </div>
      )}

      {/* Sign In Button */}
      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {loginMutation.isPending ? (
          <>
            <Spinner className="size-5" />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
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
        variant="secondary"
        size="lg"
        onClick={() => loginWithGoogleMutation.mutate()}
        className="w-full"
        disabled={isPending}
      >
        {loginWithGoogleMutation.isPending && <Spinner className="size-5" />}
        <RiGoogleFill size={24} />
        <span>{loginWithGoogleMutation.isPending ? 'Signing in...' : 'Sign in with Google'}</span>
      </Button>

      {/* Error Message */}
      {oAuthErrorCode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{oAuthErrorMessage}</p>
        </div>
      )}
    </form>
  )
}
