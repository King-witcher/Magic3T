import { Module } from '@nestjs/common'
import { BotsService } from './bots.service'
import { ClientSyncService } from './client-sync.service'
import { MatchStore } from './lib/match-bank'
import { MatchController } from './match.controller'
import { MatchGateway } from './match.gateway'
import { MatchService } from './match.service'
import { MatchHistoryService } from './match-history.service'
import { PersistanceService } from './persistance.service'

@Module({
  controllers: [MatchController],
  providers: [
    MatchGateway,
    MatchStore,
    MatchService,
    MatchHistoryService,
    ClientSyncService,
    BotsService,
    PersistanceService,
  ],
  exports: [MatchService],
})
export class MatchModule {}
