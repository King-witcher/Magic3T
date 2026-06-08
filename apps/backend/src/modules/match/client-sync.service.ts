import { MatchReportPayload, StateReportPayload } from '@magic3t/api-types'
import { ClientRank, Division, League } from '@magic3t/common-types'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { UserRatingFields } from '@/modules/rating'
import { FinishedMatchSummary } from './events/match-finished-event'

function toClientRank(r: UserRatingFields): ClientRank {
  return {
    league: r.rank_league as League | null,
    division: r.rank_division as Division | null,
    lp: r.rank_lp,
  }
}

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
    this.websocketEmitterService.send(userId, 'match', 'state-report', stateReport)
  }

  /**
   * Sends the final match summary to players after the match is finished.
   */
  @OnEvent('match.finished')
  async sendMatchSummary(summary: FinishedMatchSummary) {
    const socketSummary: MatchReportPayload = {
      order: {
        lpGain: summary.order.lpGain,
        score: summary.order.matchScore,
        newRank: toClientRank(summary.order.newRating),
      },
      chaos: {
        lpGain: summary.chaos.lpGain,
        score: summary.chaos.matchScore,
        newRank: toClientRank(summary.chaos.newRating),
      },
      matchId: 'undefined-match-id',
      winner: summary.winner,
    }

    for (const player of [summary.chaos, summary.order]) {
      if (player.role === 'bot') continue
      this.websocketEmitterService.send(player.userId, 'match', 'match-report', socketSummary)
    }
  }
}
