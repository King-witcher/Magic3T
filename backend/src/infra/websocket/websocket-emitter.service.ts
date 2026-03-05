import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EventNames, EventParams } from '@socket.io/component-emitter'
import { NamespacesMap, WebsocketEmitterEvent } from './types'

@Injectable()
export class WebsocketEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  send<
    TNamespace extends keyof NamespacesMap,
    TEvent extends EventNames<NamespacesMap[TNamespace]>,
  >(
    uuid: string,
    namespace: TNamespace,
    event: TEvent,
    ...data: EventParams<NamespacesMap[TNamespace], TEvent>
  ) {
    const result: WebsocketEmitterEvent<TNamespace, TEvent> = {
      namespace,
      event,
      data,
      uuid,
    }
    this.eventEmitter.emit('websocket.emit', result)
  }
}
