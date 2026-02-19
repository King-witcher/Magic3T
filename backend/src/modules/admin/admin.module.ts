import { Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [FirestoreModule],
})
export class AdminModule {}
