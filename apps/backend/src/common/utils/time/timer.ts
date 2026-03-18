import { Observable } from '../observable'
import { TimeSnapshot, TimeSnapshotState } from './time-snapshot'

interface TimerEventsMap {
  timeout(): void
}

export class Timer extends Observable<TimerEventsMap> {
  private lastSnapshot: TimeSnapshot
  private callbackCaller: NodeJS.Timeout
  private readonly callback: () => void
  public readonly initial: number

  constructor(timeMs: number, callback: () => void) {
    super()
    this.lastSnapshot = {
      at: Date.now(),
      value: timeMs,
      state: TimeSnapshotState.Paused,
    }
    this.initial = timeMs
    this.callback = callback
  }

  private handleTimeout() {
    this.lastSnapshot = {
      at: Date.now(),
      value: 0,
      state: TimeSnapshotState.Finished,
    }

    this.callback()
    this.emit('timeout')
  }

  public get state(): TimeSnapshotState {
    return this.lastSnapshot.state
  }

  public get remaining(): number {
    switch (this.lastSnapshot.state) {
      case TimeSnapshotState.Counting: {
        const now = Date.now()
        const timeSinceSnapshot = now - this.lastSnapshot.at
        return this.lastSnapshot.value - timeSinceSnapshot
      }
      case TimeSnapshotState.Paused:
        return this.lastSnapshot.value
      default:
        return 0
    }
  }

  public set remaining(value: number) {
    if (this.lastSnapshot.state === TimeSnapshotState.Finished) return

    this.lastSnapshot = {
      at: Date.now(),
      value: value,
      state: this.lastSnapshot.state,
    }

    if (this.lastSnapshot.state === TimeSnapshotState.Counting) {
      clearTimeout(this.callbackCaller)
      this.callbackCaller = setTimeout(this.handleTimeout.bind(this), value)
    }
  }

  public pause() {
    if (this.lastSnapshot.state !== TimeSnapshotState.Counting) return

    clearTimeout(this.callbackCaller)
    this.lastSnapshot = {
      at: Date.now(),
      value: this.remaining,
      state: TimeSnapshotState.Paused,
    }
  }

  public start() {
    if (this.lastSnapshot.state !== TimeSnapshotState.Paused) return

    this.lastSnapshot = {
      at: Date.now(),
      value: this.remaining,
      state: TimeSnapshotState.Counting,
    }
    this.callbackCaller = setTimeout(this.handleTimeout.bind(this), this.remaining)
  }
}
