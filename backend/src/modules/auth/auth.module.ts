import KeyvValkey from '@keyv/valkey'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { CacheableMemory } from 'cacheable'
import Keyv from 'keyv'
import { FirebaseModule } from '@/infra/firebase'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthControllerService } from './auth-controller.service'

@Global()
@Module({
  imports: [
    FirebaseModule,
    CacheModule.register({
      stores: [
        new Keyv({
          store: new CacheableMemory(),
        }),
        new KeyvValkey({
          host: process.env.VALKEY_HOST,
        }),
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthControllerService, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
