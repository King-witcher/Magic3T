export enum TimeSnapshotState {
  Paused = 'paused',
  Counting = 'counting',
  Finished = 'finished',
}

export type TimeSnapshot = {
  /** When the snapshot was created */
  at: number
  /** The value when the snapshot was created */
  value: number
  /** The state of the snapshot at that moment */
  state: TimeSnapshotState
}
