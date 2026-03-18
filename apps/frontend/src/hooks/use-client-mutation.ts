import { ApiNamespace } from '@magic3t/api-types'
import { UseMutationOptions, UseMutationResult, useMutation } from '@tanstack/react-query'
import { ApiUserClient, ClientError } from '@/services/clients'
import { BaseApiClient } from '@/services/clients/base-api-client'

type ClientMethodName<Client extends BaseApiClient> = {
  // biome-ignore lint/suspicious/noExplicitAny: Function types are contravariant in their parameters
  [Method in keyof Client]: Client[Method] extends (param?: any) => Promise<unknown>
    ? Method
    : never
}[keyof Client]

type ClientMethodParams<
  Client extends BaseApiClient,
  Method extends ClientMethodName<Client>,
> = Client[Method] extends (params: infer Params) => Promise<unknown>
  ? unknown extends Params
    ? // biome-ignore lint/suspicious/noConfusingVoidType: This is an optional parameter
      void
    : Params
  : never

type UseClientMutationOptions<
  Client extends BaseApiClient,
  Method extends ClientMethodName<Client>,
> = Omit<
  UseMutationOptions<
    ClientMethodResult<Client, Method>,
    ClientError,
    ClientMethodParams<Client, Method>
  >,
  'mutationKey' | 'mutationFn'
>

type ClientMethodResult<
  Client extends BaseApiClient,
  Method extends ClientMethodName<Client>,
> = Client[Method] extends () => Promise<infer R> ? R : never

type UseClientMutationResult<
  Client extends BaseApiClient,
  Method extends ClientMethodName<Client>,
> = UseMutationResult<
  ClientMethodResult<Client, Method>,
  ClientError,
  ClientMethodParams<Client, Method>
>

export function useClientMutation<
  Namespace extends ApiNamespace,
  Client extends BaseApiClient<Namespace>,
  Method extends ClientMethodName<Client>,
>(
  client: Client,
  methodName: Method,
  options: UseClientMutationOptions<Client, Method>
): UseClientMutationResult<Client, Method> {
  const mutationKey = [client.namespace, methodName]

  const method = client[methodName] as (
    args: ClientMethodParams<Client, Method>
  ) => Promise<ClientMethodResult<Client, Method>>

  const mutation = useMutation({
    ...options,
    mutationKey,
    mutationFn: method.bind(client),
  })

  return mutation
}

// Type tests - This will be tree shaked
const userClient = new ApiUserClient()
function _useTest() {
  const updateIcon = useClientMutation(userClient, 'updateIcon', {})
  updateIcon.mutate(0)
}
