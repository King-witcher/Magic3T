/// <reference types="vite/client" />
/** biome-ignore-all lint/correctness/noUnusedVariables: This is a vite-env file */

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CDN_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE: string
}

declare global {
  type Result<T, E> = ResultClass<T, E>
  interface Window {
    Ok<T, E>(data: T): ResultClass<T, E>
    Err<T, E>(error: E): ResultClass<T, E>
  }

  namespace NodeJS {
    interface ProcessEnv {
      API: string
    }
  }
}
