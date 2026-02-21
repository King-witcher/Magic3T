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

type RequestParams<T = unknown> = {
  endpoint: string
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  payload?: T
  authenticated?: boolean
}

export class BaseApiClient {
  constructor(public readonly namespace?: string) {}

  private get apiUrl(): string {
    // This value is stored on a CVar for easy configuration during development and production.
    return Console.getCvarString(SystemCvars.SvApiUrl)
  }

  private get basePath(): string {
    return this.namespace ? `${this.apiUrl}/${this.namespace}` : this.apiUrl
  }

  protected async get<T>(endpoint: string, authenticated = true): Promise<T> {
    return this.request<unknown, T>({ endpoint, method: 'GET', payload: null, authenticated })
  }

  protected async post<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    authenticated = true
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>({ endpoint, method: 'POST', payload, authenticated })
  }

  protected async put<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    authenticated = true
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>({ endpoint, method: 'PUT', payload, authenticated })
  }

  protected async patch<TPayload, TResonse>(
    endpoint: string,
    payload: TPayload,
    authenticated = true
  ): Promise<TResonse> {
    return this.request<TPayload, TResonse>({ endpoint, method: 'PATCH', payload, authenticated })
  }

  protected async delete<TResonse>(endpoint: string, authenticated = true): Promise<TResonse> {
    return this.request<unknown, TResonse>({
      endpoint,
      method: 'DELETE',
      payload: null,
      authenticated,
    })
  }

  private async request<TPayload, TResonse>({
    endpoint,
    payload,
    authenticated = true,
    method = 'GET',
  }: RequestParams<TPayload>): Promise<TResonse> {
    const url = `${this.basePath}/${endpoint}`
    const headers = new Headers()
    const init: RequestInit = {
      method,
      headers,
    }

    // If there is a payload, serialize it as JSON and add it to the request body.
    if (payload) {
      if (method === 'GET' || method === 'DELETE') {
        throw new Error(`Payload is not supported for HTTP method '${method}'`)
      }
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
