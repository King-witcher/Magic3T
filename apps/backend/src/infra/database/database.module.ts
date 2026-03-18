import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import {
  CredentialRepository,
  IconRepository,
  IdentityRepository,
  UserRepository,
} from './repositories'
import { MatchRepository } from './repositories/match-repository'

@Module({
  providers: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
    MatchRepository,
  ],
  exports: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
    MatchRepository,
  ],
})
export class DatabaseModule {}
