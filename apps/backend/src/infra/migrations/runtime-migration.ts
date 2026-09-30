import { IDbClient } from '@/shared/database'

export const RUNTIME_MIGRATIONS_KEY = Symbol('runtime_migrations')

export abstract class RuntimeMigration {
  abstract readonly name: string
  abstract up(client: IDbClient): Promise<void>
}
