import { CacheModule } from '@nestjs/cache-manager'
import { DynamicModule, ForwardReference, Global, Module, Provider, Type } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { SentryModule } from '@sentry/nestjs/setup'
import { ResponseErrorFilter, ThrottlingFilter, UnexpectedErrorFilter } from '@/common'
import { AdminModule, AuthModule, QueueModule, RatingModule, UserModule } from '@/modules'
import { AppController } from './app.controller'
import { AppGateway } from './app.gateway'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { InfrastructureModule } from './infra/infrastructure.module'
import { HoneypotModule } from './modules/honeypot'

const EXTERNAL_MODULES: (
  | DynamicModule
  | Type<unknown>
  | Promise<DynamicModule>
  | ForwardReference<unknown>
)[] = [
  SentryModule.forRoot(),
  ThrottlerModule.forRoot([
    {
      name: 'short',
      ttl: 1000,
      limit: 10,
    },
    {
      name: 'medium',
      ttl: 60 * 1000, // minute
      limit: 4 * 60,
    },
    {
      name: 'high',
      ttl: 60 * 60 * 1000, // hour
      limit: 60 * 60 * 3,
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
]

const MODULES: (
  | DynamicModule
  | Type<unknown>
  | Promise<DynamicModule>
  | ForwardReference<unknown>
)[] = [
  InfrastructureModule,
  AdminModule,
  AuthModule,
  HoneypotModule,
  QueueModule,
  RatingModule,
  UserModule,
]

const FILTERS: Provider[] = [
  {
    provide: APP_FILTER,
    useClass: UnexpectedErrorFilter,
  },
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
  {
    provide: APP_FILTER,
    useClass: ResponseErrorFilter,
  },
  {
    provide: APP_FILTER,
    useClass: ThrottlingFilter,
  },
]

@Global()
@Module({
  imports: [...EXTERNAL_MODULES, ...MODULES],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ...FILTERS,
    AppGateway,
  ],
})
export class AppModule {}
