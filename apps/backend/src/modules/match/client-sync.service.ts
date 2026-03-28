import { MatchReportPayload, MatchServerEvents, StateReportPayload } from '@magic3t/api-types'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { FinishedMatchContext } from './events/match-finished-event'

/**
 * Service responsible for syncing match state and results to clients.
 */
@Injectable()
export class ClientSyncService {
  constructor(private readonly websocketEmitterService: WebsocketEmitterService) {}

  /**
   * Sends the current match state report to a player.
   */
  // Since this is the only method that cares about StateReportPayload, we call it directly instead of emitting an event.
  sendStateReport(userId: string, stateReport: StateReportPayload) {
    this.websocketEmitterService.send(userId, 'match', MatchServerEvents.StateReport, stateReport)
  }

  /**
   * Sends the final match summary to players after the match is finished.
   */
  @OnEvent('match.finished')
  async sendMatchSummary(summary: FinishedMatchContext) {
    const socketSummary: MatchReportPayload = {
      order: {
        lpGain: summary.order.lpGain,
        score: summary.order.matchScore,
        newRank: summary.order.newRank,
      },
      chaos: {
        lpGain: summary.chaos.lpGain,
        score: summary.chaos.matchScore,
        newRank: summary.chaos.newRank,
      },
      matchId: 'undefined-match-id',
      winner: summary.winner,
    }

    for (const player of [summary.chaos, summary.order]) {
      if (player.row.role === 'bot') continue
      this.websocketEmitterService.send(
        player.row.id,
        'match',
        MatchServerEvents.MatchReport,
        socketSummary
      )
    }
  }
}
