import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { FirestoreService } from './firestore.service'

import {
  ConfigRepository,
  CrashReportsRepository,
  MatchRepository,
  UserDocumentRepository,
} from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [
    FirestoreService,
    UserDocumentRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
  exports: [
    FirestoreService,
    UserDocumentRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
})
export class FirestoreModule {}
