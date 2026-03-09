import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import {
  CredentialRepository,
  IconRepository,
  IdentityRepository,
  UserRepository,
} from './repositories'

@Module({
  providers: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
  ],
  exports: [
    DatabaseService,
    IconRepository,
    UserRepository,
    IdentityRepository,
    CredentialRepository,
  ],
})
export class DatabaseModule {}
