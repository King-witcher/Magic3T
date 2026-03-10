import { UserCredentialRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { IDbClient, INSERT_INTO, sql } from '@/shared/database'
import { DatabaseService } from '../database.service'

@Injectable()
export class CredentialRepository {
  private logger = new Logger(CredentialRepository.name, { timestamp: true })
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Creates a new user credential record in the database.
   *
   * The `password_last_changed` field is automatically set to the current timestamp.
   */
  async create(username: string, password_digest: string, userId: number, client?: IDbClient) {
    client ??= this.databaseService
    const cred: Omit<UserCredentialRow, 'password_last_changed'> = {
      user_id: userId,
      username_slug: this.slugify(username),
      password_digest,
    }
    await client.query(INSERT_INTO('user_credential', cred))
  }

  /**
   * Retrieves a user credential by username.
   *
   * The search is case-insensitive and ignores leading/trailing whitespace.
   */
  async findByUsername(username: string, client?: IDbClient): Promise<UserCredentialRow | null> {
    client ??= this.databaseService

    const slug = this.slugify(username)
    const [result] = await client.query<UserCredentialRow>(sql`
      SELECT *
      FROM user_credential
      WHERE username_slug = ${slug}
    `)
    return result ?? null
  }

  private slugify(username: string): string {
    return username.trim().toLowerCase()
  }
}
