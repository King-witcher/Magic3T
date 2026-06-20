import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { FirestoreService } from './firestore.service'

import { ConfigRepository, CrashReportsRepository } from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [FirestoreService, ConfigRepository, CrashReportsRepository],
  exports: [FirestoreService, ConfigRepository, CrashReportsRepository],
})
export class FirestoreModule {}
