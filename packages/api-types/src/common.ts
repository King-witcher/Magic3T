export type ErrorResponse<T extends string = string> = {
  errorCode: T
  metadata?: unknown
}

export type ApiNamespace = 'user' | 'admin' | 'match' | 'queue' | undefined

export type OAuthProvider = 'firebase'
