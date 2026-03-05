import { Module } from '@nestjs/common'
import { FirebaseService } from './firebase.service'
import { FirebaseAuthService } from './firebase-auth.service'

@Module({
  providers: [FirebaseService, FirebaseAuthService],
  exports: [FirebaseService, FirebaseAuthService],
})
export class FirebaseModule {}
