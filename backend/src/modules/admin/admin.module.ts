import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/infra/database'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [DatabaseModule],
  exports: [AdminService],
})
export class AdminModule {}
