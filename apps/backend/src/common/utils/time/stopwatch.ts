import { TimeSnapshot, TimeSnapshotState } from './time-snapshot'

export class Stopwatch {
  private lastSnapshot: TimeSnapshot

  constructor() {
    this.lastSnapshot = {
      state: TimeSnapshotState.Paused,
      at: Date.now(),
      value: 0,
    }
  }

  public get time() {
    if (this.lastSnapshot.state === TimeSnapshotState.Paused) return this.lastSnapshot.value

    const now = Date.now()
    return now - this.lastSnapshot.at + this.lastSnapshot.value
  }

  public pause() {
    if (this.lastSnapshot.state === TimeSnapshotState.Paused) return

    this.lastSnapshot = {
      value: this.time,
      at: Date.now(),
      state: TimeSnapshotState.Paused,
    }
  }

  public start() {
    if (this.lastSnapshot.state === TimeSnapshotState.Counting) return

    this.lastSnapshot = {
      value: this.lastSnapshot.value,
      at: Date.now(),
      state: TimeSnapshotState.Counting,
    }
  }
}
