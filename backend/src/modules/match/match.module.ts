import { Module } from '@nestjs/common'
import { ClientSyncService } from './client-sync.service'
import { MatchStore } from './lib/match-bank'
import { MatchController } from './match.controller'
import { MatchGateway } from './match.gateway'
import { MatchService } from './match.service'

@Module({
  controllers: [MatchController],
  providers: [MatchGateway, MatchStore, MatchService, ClientSyncService],
  exports: [MatchService],
})
export class MatchModule {}
