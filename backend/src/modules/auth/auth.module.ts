import KeyvValkey from '@keyv/valkey'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { CacheableMemory } from 'cacheable'
import Keyv from 'keyv'
import { FirebaseModule } from '@/infra/firebase'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [
    FirebaseModule,
    CacheModule.register({
      stores: [
        new Keyv({
          store: new CacheableMemory(),
        }),
        new KeyvValkey(process.env.VALKEY_HOST),
      ],
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
