import { SessionData } from './shared/types/session-data'

declare global {
  namespace Express {
    export interface Request {
      session?: SessionData
    }
  }

  function Ok<T, E>(value: T): import('@/common').Result<T, E>
  function Err<T, E>(error: E): import('@/common').Result<T, E>
  function panic(message?: string): never

  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_CLIENT_EMAIL: string
      FIREBASE_PRIVATE_KEY: string
      FIREBASE_PROJECT_ID: string
      FIRESTORE_DB: string
      HEARTBEAT_RATE: string
      MAGIC3T_BACKEND_URL: string
      PG_DATABASE: string
      PG_HOST: string
      PG_PASSWORD: string
      PG_PORT: string
      PG_USER: string
      PG_SSL: 'true' | 'false'
      PORT: number
      QUEUE_STATUS_POLLING_RATE: number
      SENTRY_DSN: string
      VALKEY_HOST: string
    }
  }
}
