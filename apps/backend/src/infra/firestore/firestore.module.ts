import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { FirestoreService } from './firestore.service'

import { ConfigRepository, CrashReportsRepository, UserDocumentRepository } from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [FirestoreService, UserDocumentRepository, ConfigRepository, CrashReportsRepository],
  exports: [FirestoreService, UserDocumentRepository, ConfigRepository, CrashReportsRepository],
})
export class FirestoreModule {}
