import { Global, Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { FirebaseModule } from './firebase'
import { FirestoreModule } from './firestore'
import { WebsocketModule } from './websocket/websocket.module'

@Global()
@Module({
  imports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule],
  exports: [DatabaseModule, FirebaseModule, FirestoreModule, WebsocketModule],
})
export class InfrastructureModule {}
