import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { IconRepository } from './repositories/icon-repository'
import { UserRepository } from './repositories/user-repository'

@Module({
  providers: [DatabaseService, IconRepository, UserRepository],
  exports: [DatabaseService, IconRepository, UserRepository],
})
export class DatabaseModule {}
