import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { SentryModule } from '@sentry/nestjs/setup'
import { ResponseErrorFilter, ThrottlingFilter, UnexpectedErrorFilter } from '@/common'
import { FirebaseModule, FirestoreModule } from '@/infra'
import { AdminModule, AuthModule, QueueModule, RatingModule, UserModule } from '@/modules'
import { AppController } from './app.controller'
import { AppGateway } from './app.gateway'
import { WebsocketModule } from './infra/websocket/websocket.module'

@Global()
@Module({
  imports: [
    SentryModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60 * 1000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({ envFilePath: '.env' }),
    CacheModule.register({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    ScheduleModule.forRoot(),
    RatingModule,
    AuthModule,
    QueueModule,
    FirestoreModule,
    FirebaseModule,
    UserModule,
    AdminModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: UnexpectedErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlingFilter,
    },
    AppGateway,
  ],
})
export class AppModule {}
