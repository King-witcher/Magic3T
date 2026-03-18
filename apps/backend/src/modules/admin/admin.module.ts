import { Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'
import { AdminController } from './admin.controller'

@Module({
  controllers: [AdminController],
  imports: [FirestoreModule],
})
export class AdminModule {}
