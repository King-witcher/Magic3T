import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { IdentityRepository } from './repositories'
import { IconRepository } from './repositories/icon-repository'
import { UserRepository } from './repositories/user-repository'

@Module({
  providers: [DatabaseService, IconRepository, UserRepository, IdentityRepository],
  exports: [DatabaseService, IconRepository, UserRepository, IdentityRepository],
})
export class DatabaseModule {}
