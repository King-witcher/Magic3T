import { ApiNamespace } from '@magic3t/api-types'
import { authClient } from '@/lib/auth-client'
import { Console, SystemCvars } from '@/lib/console'
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from './client-error'

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ClientRequestOptions = {
  authenticated?: boolean
  signal?: AbortSignal
}

export class BaseApiClient<Namespace extends ApiNamespace = ApiNamespace> {
  constructor(public readonly namespace: Namespace) {}

  private get apiUrl(): string {
    // This value is stored on a CVar for easy configuration during development and production.
    return Console.getCvarString(SystemCvars.SvApiUrl)
  }

  private get basePath(): string {
    return this.namespace ? `${this.apiUrl}/${this.namespace}` : this.apiUrl
  }

  protected async get<T>(endpoint: string, options?: ClientRequestOptions): Promise<T> {
    return this.request<unknown, T>('GET', endpoint, undefined, options)
  }

  protected async post<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    options?: ClientRequestOptions
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>('POST', endpoint, payload, options)
  }

  protected async put<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    options?: ClientRequestOptions
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>('PUT', endpoint, payload, options)
  }

  protected async patch<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    options?: ClientRequestOptions
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>('PATCH', endpoint, payload, options)
  }

  protected async delete<TResonse>(
    endpoint: string,
    options?: ClientRequestOptions
  ): Promise<TResonse> {
    return this.request<unknown, TResonse>('DELETE', endpoint, undefined, options)
  }

  private async request<TPayload, TResonse>(
    method: HTTPMethod,
    endpoint: string,
    payload?: TPayload | undefined,
    { authenticated = true, signal }: ClientRequestOptions = {}
  ): Promise<TResonse> {
    const url = `${this.basePath}/${endpoint}`
    const headers = new Headers()
    const init: RequestInit = {
      method,
      headers,
      signal,
    }

    // If there is a payload, serialize it as JSON and add it to the request body.
    if (payload !== undefined) {
      if (method === 'GET' || method === 'DELETE')
        Console.log(`Payload is not supported for HTTP method '${method}'`)

      headers.set('Content-Type', 'application/json')
      init.body = JSON.stringify(payload)
    }

    // If authentication is required, add the Authorization header with the token.
    if (authenticated) headers.set('Authorization', `Bearer ${await authClient.token}`)

    const request = new Request(url, init)
    const response = await fetch(request)
    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new BadRequestError(request, response)
        case 401:
          throw new UnauthorizedError(request, response)
        case 403:
          throw new ForbiddenError(request, response)
        case 404:
          throw new NotFoundError(request, response)
        case 429:
          throw new RateLimitError(request, response)
        case 500:
          throw new InternalServerError(request, response)
        default:
          throw new Error(`Unhandled error: ${response.status}`)
      }
    }

    try {
      return await response.json()
    } catch {
      return undefined as unknown as TResonse
    }
  }
}
