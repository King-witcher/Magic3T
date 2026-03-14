import { ApiNamespace } from '@magic3t/api-types'
import { UseQueryOptions, UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { use, useCallback } from 'react'
import { AuthContext } from '@/contexts/auth/auth-context'
import { ApiUserClient, ClientError } from '@/services/clients'
import { BaseApiClient } from '@/services/clients/base-api-client'

type ClientQueryName<Client extends BaseApiClient> = {
  [Method in keyof Client]: Client[Method] extends (
    // biome-ignore lint/suspicious/noExplicitAny: Function types are contravariant in their parameters
    params: any,
    signal: AbortSignal
  ) => Promise<unknown>
    ? Method
    : never
}[keyof Client]

type UseClientQueryOptions = Omit<
  // biome-ignore lint/suspicious/noExplicitAny: Function types are contravariant in their parameters
  UseQueryOptions<any, ClientError>,
  'queryKey' | 'queryFn'
> & {
  /**
   * Defines whether the user id should be included in the query key. The request methods themselves handle authentication.
   *
   * Defaults to `true`
   */
  authenticated?: boolean
}

type UseClientQueryResult<Result> = UseQueryResult<Result, ClientError> & {
  setData: (data: Result | ((oldData: Result | undefined) => Result)) => void
  invalidate: () => void
}

type ClientQueryParams<
  Client extends BaseApiClient,
  Method extends ClientQueryName<Client>,
> = Client[Method] extends (signal: AbortSignal) => Promise<unknown>
  ? // biome-ignore lint/suspicious/noConfusingVoidType: This is an optional parameter
    void
  : Client[Method] extends (params: infer P, signal: AbortSignal) => Promise<unknown>
    ? P
    : never

type ClientQueryResult<
  Client extends BaseApiClient,
  Method extends ClientQueryName<Client>,
  // biome-ignore lint/suspicious/noExplicitAny: Function types are contravariant in their parameters
> = Client[Method] extends (...args: any[]) => Promise<infer R> ? R : never

type FinalARgsList<T, OptionalLast> = T extends void ? [OptionalLast?] : [T, OptionalLast?]

export function useClientQuery<
  Namespace extends ApiNamespace,
  Client extends BaseApiClient<Namespace>,
  Method extends ClientQueryName<Client>,
>(
  client: Client,
  functionName: Method,
  ...argsList: FinalARgsList<ClientQueryParams<Client, Method>, UseClientQueryOptions>
): UseClientQueryResult<ClientQueryResult<Client, Method>> {
  const { authenticated, ...tanstackQueryOptions } = (
    argsList.length === 2 ? argsList[1] : argsList[0]
  ) as UseClientQueryOptions

  const auth = use(AuthContext)
  const queryClient = useQueryClient()

  if (authenticated && !auth) {
    throw new Error('useClientQuery: Authenticated query used outside of AuthProvider')
  }

  const queryKey =
    argsList.length === 2
      ? authenticated
        ? [client.namespace, functionName, argsList[0], auth?.uuid]
        : [client.namespace, functionName, argsList[0]]
      : authenticated
        ? [client.namespace, functionName, auth?.uuid]
        : [client.namespace, functionName]

  const query = useQuery({
    ...tanstackQueryOptions,
    queryKey,
    queryFn: async ({ signal }) => {
      const queryFunction = (
        client[functionName] as (params: unknown, signal?: AbortSignal) => Promise<unknown>
      ).bind(client)
      switch (queryFunction.length) {
        case 2:
          return await queryFunction(argsList[0], signal)
        case 1:
          return await queryFunction(signal)
        default:
          throw new Error('Invalid number of arguments for useClientQuery') // This should never happen due to the type system, but we need it to satisfy TypeScript
      }
    },
  })

  const setData = useCallback(
    (
      data:
        | ClientQueryResult<Client, Method>
        | ((
            oldData: ClientQueryResult<Client, Method> | undefined
          ) => ClientQueryResult<Client, Method>)
    ) => {
      queryClient.setQueryData(queryKey, data)
    },
    [queryClient, queryKey]
  )

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    ...query,
    setData,
    invalidate,
  }
}

// This is tree shaked
const userClient = new ApiUserClient()

function _useTest() {
  // biome-ignore lint/correctness/useHookAtTopLevel: This is just a test
  const _getRanking = useClientQuery(userClient, 'getRanking', {})
  // biome-ignore lint/correctness/useHookAtTopLevel: This is just a test
  const _getById = useClientQuery(userClient, 'getById', '123', {})

  // Typescript should complain
  // useClientQuery(userClient, 'getRanking', '1234')
  // useClientQuery(userClient, 'getById')
}
