export type QueueServerEvents =
  | 'queueRejected'
  | 'queueAccepted'
  | 'queueModes'
  | 'matchFound'
  | 'liveGameStats'

export type QueueClientEvents =
  | 'interact'
  | 'fair'
  | 'bot-0'
  | 'bot-1'
  | 'bot-2'
  | 'bot-3'
  | 'casual'
  | 'ranked'
  | 'dequeue'

export type LiveGameStatsPayload = {
  connected: number
  casual: { queue: number; inGame: number }
  ranked: { queue: number; inGame: number }
}

export interface QueueServerEventsMap {
  queueModes(payload: { casual: boolean; ranked: boolean }): void
  matchFound(data: { matchId: string; opponentId: string }): void
  liveGameStats(data: LiveGameStatsPayload): void
}

export interface QueueClientEventsMap {
  interact(): void
}
