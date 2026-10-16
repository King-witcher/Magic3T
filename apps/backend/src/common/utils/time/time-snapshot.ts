export enum TimeSnapshotState {
  Paused = 'paused',
  Counting = 'counting',
  Finished = 'finished',
}

export type TimeSnapshot = {
  at: number
  value: number
  state: TimeSnapshotState
}
