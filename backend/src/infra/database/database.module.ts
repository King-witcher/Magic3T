import { Global, Module } from '@nestjs/common'
import { FirebaseModule } from '@/infra/firebase'
import { DatabaseService } from './database.service'

import {
  BanRepository,
  ConfigRepository,
  CrashReportsRepository,
  MatchRepository,
  UserRepository,
} from './repositories'

@Global()
@Module({
  imports: [FirebaseModule],
  providers: [
    DatabaseService,
    UserRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
    BanRepository,
  ],
  exports: [
    DatabaseService,
    UserRepository,
    MatchRepository,
    ConfigRepository,
    CrashReportsRepository,
    BanRepository,
  ],
})
export class DatabaseModule {}
