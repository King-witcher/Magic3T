import { Module } from '@nestjs/common'
import { AuthModule } from '@/modules'
import { DatabaseService } from './database.service'
import { IconRepository } from './repositories/icon-repository'
import { UserRepository } from './repositories/user-repository'

@Module({
  imports: [AuthModule],
  providers: [DatabaseService, IconRepository, UserRepository],
  exports: [DatabaseService, IconRepository, UserRepository],
})
export class DatabaseModule {}
