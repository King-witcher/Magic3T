import { Global, Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { FirebaseModule } from './firebase'
import { FirestoreModule } from './firestore'
import { FirewallModule } from './firewall/firewall.module'
import { RedisModule } from './redis/redis.module'
import { WebsocketModule } from './websocket/websocket.module'

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    FirebaseModule,
    FirestoreModule,
    FirewallModule,
    RedisModule,
    WebsocketModule,
  ],
  exports: [
    ConfigModule,
    DatabaseModule,
    FirebaseModule,
    FirestoreModule,
    FirewallModule,
    RedisModule,
    WebsocketModule,
  ],
})
export class InfrastructureModule {}
