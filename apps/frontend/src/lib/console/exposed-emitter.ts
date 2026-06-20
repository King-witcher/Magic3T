import { EventsMap, Observable } from '../observable'

export class ExposedEmitter<T extends EventsMap> extends Observable<T> {
  public publicEmit<Event extends keyof T>(event: Event, ...data: Parameters<T[Event]>) {
    this.emit(event, ...data)
  }
}
