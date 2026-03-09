import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes, sendPasswordResetEmail } from 'firebase/auth'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiGoogleFill } from 'react-icons/ri'
import { Button, Input, Spinner } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { AuthState, useAuth } from '@/contexts/auth-context'
import { Console } from '@/lib/console'
import { firebaseClient } from '@/lib/firebase-client'
import { auth } from '@/services/firebase'
import { isValidEmail } from '@/utils/isValidEmail'

export const Route = createFileRoute('/_auth/sign-in')({
  component: Page,
})

type FirebaseAuthErrorCode = (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes]

const ERROR_MAP: Partial<Record<FirebaseAuthErrorCode, string>> = {
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This user account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email address but different sign-in credentials.',
  'auth/cancelled-popup-request': 'Sign-in popup was closed before completing the sign-in.',
  'auth/weak-password': 'The password is too weak. Please choose a stronger password.',
  'auth/email-already-in-use': 'The email address is already in use by another account.',
  'auth/missing-password': 'Password is required.',
  'auth/network-request-failed':
    'Network error. Please check your internet connection and try again.',
  'auth/popup-blocked':
    'The sign-in popup was blocked by the browser. Please allow popups and try again.',
  'auth/invalid-credential': 'The provided authentication credentials are invalid.',
}

function Page() {
  const auth = useAuth()
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [hideResetPassword, setHideResetPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError: setFormError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const email = watch('email')

  const signInWithEmailMutation = useMutation({
    mutationKey: ['sign-in-email'],
    async mutationFn(data: { email: string; password: string }) {
      return firebaseClient.signInWithEmail(data.email, data.password)
    },
    onMutate: () => {
      setErrorCode(null)
    },
    onError(e) {
      console.error(e)
      if (e instanceof FirebaseError) {
        Console.log(`Failed to sign in with email: ${e.message}`)
        setErrorCode(e.code)
      }
    },
  })

  const signInGoogleMutation = useMutation({
    mutationKey: ['sign-in-google'],
    async mutationFn() {
      if (auth.state === AuthState.NotSignedIn) {
        await auth.signInWithGoogle()
      }
    },
    onMutate: () => {
      setErrorCode(null)
    },
    onError(e) {
      console.error(e)
      if (e instanceof FirebaseError) {
        Console.log(`Failed to sign in with Google: ${e.message}`)
        setErrorCode(e.code)
      }
    },
  })

  // const recoverPasswordMutation = useMutation({
  //   mutationKey: ['recover-password'],
  //   async mutationFn(email: string) {
  //     return sendPasswordResetEmail(auth, email)
  //   },
  //   onMutate: () => {
  //     setErrorCode(null)
  //   },
  //   onError(e) {
  //     console.error(e)
  //     if (e instanceof FirebaseError) {
  //       Console.log(`Failed to sign in with email: ${e.message}`)
  //       setErrorCode(e.code)
  //     }
  //   },
  // })

  function signInEmail(data: { email: string; password: string }) {
    signInWithEmailMutation.mutate(data)
  }

  // const handleRecover = useCallback(async () => {
  //   if (!isValidEmail(email)) {
  //     setFormError('email', {})
  //     setErrorCode('auth/invalid-email')
  //     return
  //   }

  //   setErrorCode(null)
  //   clearErrors()
  //   setHideResetPassword(true)
  //   setTimeout(() => setHideResetPassword(false), 5000)
  //   await sendPasswordResetEmail(auth, email)
  // }, [email, setFormError, clearErrors])

  const isPending = signInWithEmailMutation.isPending || signInGoogleMutation.isPending || false
  // recoverPasswordMutation.isPending

  const errorMessage = errorCode
    ? (ERROR_MAP[errorCode as FirebaseAuthErrorCode] ?? errorCode)
    : null

  return (
    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(signInEmail)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif font-bold text-4xl text-gold-4 uppercase tracking-wide">
          Sign In
        </h2>
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

      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          disabled={isPending}
          error={!!errors.email}
          {...register('email', { required: true })}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">Email is required</p>}
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
      {errorCode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{errorMessage}</p>
        </div>
      )}

      {/* Forgot Password */}
      <div className="text-right">
        {hideResetPassword ? (
          <p className="text-blue-2 text-sm">Recovery email sent</p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            // onClick={handleRecover}
            className="normal-case! tracking-normal! p-0! h-auto"
          >
            Forgot password?
          </Button>
        )}
      </div>

      {/* Sign In Button */}
      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? (
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
        onClick={() => signInGoogleMutation.mutate()}
        className="w-full"
      >
        <RiGoogleFill size={24} />
        <span>Sign in with Google</span>
      </Button>
    </form>
  )
}
