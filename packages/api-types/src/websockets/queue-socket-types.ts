export const enum QueueServerEvents {
  QueueRejected = 'queueRejected',
  QueueAccepted = 'queueAccepted',
  QueueModes = 'queueModes',
  MatchFound = 'matchFound',
  LiveGameStats = 'liveGameStats',
}

export const enum QueueClientEvents {
  Interact = 'interact',
  Fair = 'fair',
  Bot0 = 'bot-0',
  Bot1 = 'bot-1',
  Bot2 = 'bot-2',
  Bot3 = 'bot-3',
  Casual = 'casual',
  Ranked = 'ranked',
  Dequeue = 'dequeue',
}

export type LiveGameStatsPayload = {
  connected: number
  casual: { queue: number; inGame: number }
  ranked: { queue: number; inGame: number }
}

export interface QueueServerEventsMap {
  [QueueServerEvents.QueueModes](payload: { casual: boolean; ranked: boolean }): void
  [QueueServerEvents.MatchFound](data: { matchId: string; opponentId: string }): void
  [QueueServerEvents.LiveGameStats](data: LiveGameStatsPayload): void
}

export interface QueueClientEventsMap {
  [QueueClientEvents.Interact](): void
}
