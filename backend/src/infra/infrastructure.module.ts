import { Global, Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { FirebaseModule } from './firebase'
import { FirestoreModule } from './firestore'
import { WebsocketModule } from './websocket/websocket.module'

@Global()
@Module({
  imports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule, ConfigModule],
  exports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule, ConfigModule],
})
export class InfrastructureModule {}
