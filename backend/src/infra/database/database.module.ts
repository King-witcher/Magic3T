import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { IconRepository } from './repositories/icons-repository'

@Module({
  providers: [DatabaseService, IconRepository],
  exports: [DatabaseService, IconRepository],
})
export class DatabaseModule {}
