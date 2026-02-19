import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/infra/database'
import { AdminController } from './admin.controller'
import { AdminGuard } from './admin.guard'
import { AdminService } from './admin.service'

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  imports: [DatabaseModule],
})
export class AdminModule {}
