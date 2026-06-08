import { PasswordStrengthResult } from '@magic3t/api-types'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from '@/services/clients/api-client'
import { computePasswordStrengthHash } from './-password-hash'

const DEBOUNCE_MS = 500

export type PasswordStrengthState = {
  /** The latest strength result, or undefined while empty/loading. */
  result: PasswordStrengthResult | undefined
  /** True while a (debounced) evaluation is in flight. */
  isLoading: boolean
}

/**
 * Evaluates the strength of `password` against the backend, debounced by 500ms
 * after the user stops typing. `inputs` (username, nickname) are penalized by
 * zxcvbn and signed into the request. Changing either the password or the
 * inputs restarts the debounce.
 */
export function usePasswordStrength(password: string, inputs: string[]): PasswordStrengthState {
  // Serialized inputs: a stable primitive so the effect/query don't depend on
  // the array's referential identity (a new array every render). Used only as a
  // dependency/cache key — the request itself is signed over the real array.
  const inputsKey = inputs.join(' ')

  const [debounced, setDebounced] = useState<{ password: string; inputs: string[] }>({
    password: '',
    inputs: [],
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: inputsKey is the serialized form of `inputs`.
  useEffect(() => {
    const handle = setTimeout(() => setDebounced({ password, inputs }), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [password, inputsKey])

  const debouncedKey = debounced.inputs.join(' ')
  const enabled = debounced.password.length > 0
  const settled = password === debounced.password && inputsKey === debouncedKey

  const query = useQuery({
    queryKey: ['auth', 'password-strength', debounced.password, debouncedKey],
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async ({ signal }) => {
      const hash = await computePasswordStrengthHash(debounced.password, debounced.inputs)
      return apiClient.auth.passwordStrength(
        { password: debounced.password, inputs: debounced.inputs, hash },
        signal
      )
    },
  })

  return {
    result: enabled ? query.data : undefined,
    // Loading while the debounce is still settling or the request is in flight.
    isLoading: password.length > 0 && (!settled || query.isFetching),
  }
}
