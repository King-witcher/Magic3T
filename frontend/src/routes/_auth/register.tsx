import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes } from 'firebase/auth'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiGoogleFill } from 'react-icons/ri'
import { Button, Input, Spinner } from '@/components/atoms'
import { Label } from '@/components/ui/label'
import { Console } from '@/lib/console'
import { firebaseClient } from '@/lib/firebase-client'

interface FormData {
  email: string
  password: string
  checkPassword: string
}

export const Route = createFileRoute('/_auth/register')({
  component: RouteComponent,
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

function RouteComponent() {
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const registerWithEmailMutation = useMutation({
    mutationKey: ['register-email'],
    async mutationFn({ email, password }: { email: string; password: string }) {
      return firebaseClient.registerWithEmail(email, password)
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
      return firebaseClient.signInWithGoogle()
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

  const handleRegister = useCallback(
    async ({ email, password, checkPassword }: FormData) => {
      if (password !== checkPassword) {
        setErrorCode('Passwords do not match.')
        return
      }
      registerWithEmailMutation.mutate({ email, password })
    },
    [registerWithEmailMutation]
  )

  const waiting = signInGoogleMutation.isPending || registerWithEmailMutation.isPending
  const errorMessage = errorCode
    ? (ERROR_MAP[errorCode as FirebaseAuthErrorCode] ?? errorCode)
    : null

  return (
    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(handleRegister)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="font-serif font-bold text-4xl text-gold-4 uppercase tracking-wide">
          Register
        </h2>
        <p className="text-grey-1 text-sm mt-2">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="text-gold-3 hover:text-gold-1 font-semibold transition-colors duration-200"
            search={(prev) => ({ referrer: prev.referrer })}
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          disabled={waiting}
          error={!!errors.email}
          {...register('email', { required: true })}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">Email is required</p>}
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          disabled={waiting}
          error={!!errors.password}
          {...register('password', { required: true })}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">Password is required</p>}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          id="checkPassword"
          type="password"
          placeholder="Confirm your password"
          disabled={waiting}
          error={!!errors.checkPassword}
          {...register('checkPassword', { required: true })}
        />
        {errors.checkPassword && (
          <p className="text-red-400 text-xs mt-1">Please confirm your password</p>
        )}
      </div>

      {/* Error Message */}
      {errorCode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2">
          <p className="text-red-400 text-sm text-center">{errorMessage}</p>
        </div>
      )}

      {/* Register Button */}
      <Button type="submit" disabled={waiting} size="lg" className="w-full">
        {waiting ? (
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
