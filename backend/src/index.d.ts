declare global {
  namespace Express {
    export interface Request {
      session: import('./app/session/session.types').SessionData | null
    }
  }

  function Ok<T, E>(value: T): import('@/common').Result<T, E>
  function Err<T, E>(error: E): import('@/common').Result<T, E>
  function panic(message?: string): never

  namespace NodeJS {
    interface ProcessEnv {
      PORT: number
      FIREBASE_ADMIN_CREDENTIALS: string
      MAGIC3T_BACKEND_URL: string
      HEARTBEAT_RATE: string
      QUEUE_STATUS_POLLING_RATE: number
      SENTRY_DSN: string
      FIRESTORE_DB: string
      PG_HOST: string
      PG_PORT: string
      PG_USER: string
      PG_PASSWORD: string
      PG_DATABASE: string
    }
  }
}

export {}
