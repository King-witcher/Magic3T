import { UserRatingSnapshotRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { IDbClient, SELECT } from '@/shared/database'
import { INSERT_INTO } from '@/shared/database/pg-chain'
import { DatabaseService } from '../database.service'

@Injectable()
export class UserRatingSnapshotRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    ratingSnapshot: Omit<UserRatingSnapshotRow, 'id'>,
    client?: IDbClient
  ): Promise<void> {
    client ??= this.databaseService
    await client.query(
      INSERT_INTO<Partial<UserRatingSnapshotRow>>('user_rating_snapshot', ratingSnapshot)
    )
  }

  async createReturningId(
    ratingSnapshot: Omit<UserRatingSnapshotRow, 'id'>,
    client?: IDbClient
  ): Promise<number> {
    client ??= this.databaseService
    const query = INSERT_INTO<Partial<UserRatingSnapshotRow>>(
      'user_rating_snapshot',
      ratingSnapshot
    ).RETURNING`id`
    const [row] = await client.query<{ id: number }>(query)
    return row.id
  }

  async findLatestByUserId(
    userId: string,
    client?: IDbClient
  ): Promise<UserRatingSnapshotRow | null> {
    client ??= this.databaseService
    const query = SELECT`* FROM user_rating_snapshot
      WHERE user_id = ${userId}
      ORDER BY date DESC
      LIMIT 1`
    const [row] = await client.query<UserRatingSnapshotRow>(query)
    return row ?? null
  }
}
