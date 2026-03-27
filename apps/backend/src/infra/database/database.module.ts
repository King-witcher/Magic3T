import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import {
  CredentialRepository,
  IconRepository,
  IdentityRepository,
  UserRepository,
} from './repositories'
import { MatchRepository } from './repositories/match-repository'
import { UserRatingSnapshotRepository } from './repositories/user-rating-snapshot-repository'

@Module({
  providers: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
    MatchRepository,
    UserRatingSnapshotRepository,
  ],
  exports: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
    MatchRepository,
    UserRatingSnapshotRepository,
  ],
})
export class DatabaseModule {}
