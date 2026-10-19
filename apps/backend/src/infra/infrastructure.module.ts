import { Global, Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { FirebaseModule } from './firebase'
import { FirestoreModule } from './firestore'
import { FirewallModule } from './firewall/firewall.module'
import { WebsocketModule } from './websocket/websocket.module'

@Global()
@Module({
  imports: [
    DatabaseModule,
    FirebaseModule,
    FirestoreModule,
    WebsocketModule,
    ConfigModule,
    FirewallModule,
  ],
  exports: [
    DatabaseModule,
    FirebaseModule,
    FirestoreModule,
    WebsocketModule,
    ConfigModule,
    FirewallModule,
  ],
})
export class InfrastructureModule {}
