import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { FirestoreService } from './firestore.service'

import {
  ConfigRepository,
  CrashReportsRepository,
  MatchDocumentRepository,
  UserDocumentRepository,
} from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [
    FirestoreService,
    UserDocumentRepository,
    MatchDocumentRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
  exports: [
    FirestoreService,
    UserDocumentRepository,
    MatchDocumentRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
})
export class FirestoreModule {}
