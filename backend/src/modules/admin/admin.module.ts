import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/infra/database'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { BanService } from './ban.service'

@Module({
  controllers: [AdminController],
  providers: [AdminService, BanService],
  imports: [DatabaseModule],
})
export class AdminModule {}
