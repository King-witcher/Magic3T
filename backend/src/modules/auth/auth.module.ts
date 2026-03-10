import { Global, Module } from '@nestjs/common'
import { DatabaseModule } from '@/infra/database'
import { FirebaseModule } from '@/infra/firebase'
import { AuthService } from './auth.service'
import { BanGuard } from './ban.guard'
import { BanService } from './ban.service'

@Global()
@Module({
  imports: [FirebaseModule, DatabaseModule],
  providers: [AuthService, BanService, BanGuard],
  exports: [AuthService, BanService, BanGuard],
})
export class AuthModule {}
