import { UserRatingSnapshotRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { IDbClient } from '@/shared/database'
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
}
