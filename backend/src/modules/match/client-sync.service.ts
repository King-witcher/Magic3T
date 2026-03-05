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
    const ratingConfig = summary.rankConverter?.config

    const newOrderRank = summary.rankConverter.getRankFromElo(
      summary.order.newRating.elo,
      summary.order.row.rating_ranked_count,
      summary.order.row.rating_apex_flag
    )
    const newChaosRank = summary.rankConverter.getRankFromElo(
      summary.chaos.newRating.elo,
      summary.chaos.row.rating_ranked_count,
      summary.chaos.row.rating_apex_flag
    )

    // Calculate LP gains
    const orderLpGain = ratingConfig
      ? summary.ranked
        ? summary.order.row.rating_ranked_count > ratingConfig.min_ranked_count
          ? summary.rankConverter.getTotalLP(summary.order.newRating.elo) -
            summary.rankConverter.getTotalLP(
              summary.order.newRating.elo - summary.order.newRating.elo
            )
          : null
        : null
      : null

    // Create a match summary to be sent via socket
    const socketSummary: MatchReportPayload = {
      order: {
        lpGain: orderLpGain,
        score: summary.order.matchScore,
        newRank: newOrderRank,
      },
      chaos: {
        lpGain: null, // Replace with actual LP gain calculation for chaos if needed
        score: summary.chaos.matchScore,
        newRank: newChaosRank,
      },
      matchId: 'undefined-match-id',
      winner: summary.winner,
    }

    // Send the summary to both players, unless one of them is a bot
    for (const player of [summary.chaos, summary.order]) {
      if (player.row.role === 'bot') continue
      this.websocketEmitterService.send(
        player.row.uuid,
        'match',
        MatchServerEvents.MatchReport,
        socketSummary
      )
    }
  }
}
