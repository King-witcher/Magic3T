import { Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'
import { AdminController } from './admin.controller'
import { AdminUserService } from './admin-user.service'

@Module({
  controllers: [AdminController],
  imports: [FirestoreModule],
  providers: [AdminUserService],
})
export class AdminModule {}
