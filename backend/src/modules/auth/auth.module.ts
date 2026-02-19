import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {
  imports: [FirebaseModule]
}
