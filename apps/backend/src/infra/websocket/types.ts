import { GameClientEventsMap, GameServerEventsMap, QueueServerEventsMap } from '@magic3t/api-types'
import { EventNames, EventParams } from '@socket.io/component-emitter'

export type NamespacesMap = {
  match: GameServerEventsMap
  queue: QueueServerEventsMap
}

export type ServerEventNames = EventNames<GameServerEventsMap> | EventNames<QueueServerEventsMap>
export type ClientEventNames = EventNames<GameClientEventsMap> | EventNames<GameClientEventsMap>

export type RoomName<TNamespace extends keyof NamespacesMap = keyof NamespacesMap> =
  `user:${string}@${TNamespace}`

export type WebsocketEmitterEvent<
  TNamespace extends keyof NamespacesMap = keyof NamespacesMap,
  TEvent extends EventNames<NamespacesMap[TNamespace]> = EventNames<NamespacesMap[TNamespace]>,
> = {
  uuid?: string
  namespace: TNamespace
  event: TEvent
  data: EventParams<NamespacesMap[TNamespace], TEvent>
}
