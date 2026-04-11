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
>

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

type ArgsAndOptions<ArgsType> = ArgsType extends void
  ? [args?: ArgsType, options?: UseClientQueryOptions]
  : [args: ArgsType, options?: UseClientQueryOptions]

export function useClientQuery<
  Namespace extends ApiNamespace,
  Client extends BaseApiClient<Namespace>,
  Method extends ClientQueryName<Client>,
>(
  client: Client,
  functionName: Method,
  ...rest: ArgsAndOptions<ClientQueryParams<Client, Method>>
): UseClientQueryResult<ClientQueryResult<Client, Method>> {
  const [args, options] = rest
  const auth = use(AuthContext)
  const queryClient = useQueryClient()

  const queryKey = auth?.sessionId
    ? [client.namespace, functionName, args, auth.sessionId]
    : [client.namespace, functionName, args]

  const query = useQuery({
    ...options,
    queryKey,
    queryFn: async ({ signal }) => {
      const queryFunction = (
        client[functionName] as (params: unknown, signal?: AbortSignal) => Promise<unknown>
      ).bind(client)
      switch (queryFunction.length) {
        case 2:
          return await queryFunction(args, signal)
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
  const _getRanking = useClientQuery(userClient, 'getRanking', undefined, {})
  // biome-ignore lint/correctness/useHookAtTopLevel: This is just a test
  const _getById = useClientQuery(userClient, 'getById', '123', {})

  // Typescript should complain
  // useClientQuery(userClient, 'getRanking', '1234')
  // useClientQuery(userClient, 'getById')
}
