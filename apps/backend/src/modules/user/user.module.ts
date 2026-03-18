import { Module } from '@nestjs/common'
import { FirestoreModule } from '@/infra/firestore'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [FirestoreModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
