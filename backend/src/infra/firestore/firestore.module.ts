import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { FirestoreService } from './firestore.service'

import {
  ConfigRepository,
  CrashReportsRepository,
  MatchRepository,
  UserRepository,
} from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [
    FirestoreService,
    UserRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
  exports: [
    FirestoreService,
    UserRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
  ],
})
export class FirestoreModule {}
