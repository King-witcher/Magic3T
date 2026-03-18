import { GameClientEventsMap, GameServerEventsMap, QueueServerEventsMap } from '@magic3t/api-types'
import { EventNames } from '@socket.io/component-emitter'
import { DefaultEventsMap } from 'socket.io'

export type NamespacesMap = {
  match: GameServerEventsMap
  queue: QueueServerEventsMap
  '': DefaultEventsMap
}

export type ServerEventNames = EventNames<GameServerEventsMap> | EventNames<QueueServerEventsMap>
export type ClientEventNames = EventNames<GameClientEventsMap> | EventNames<GameClientEventsMap>

export type RoomName<TNamespace extends keyof NamespacesMap = keyof NamespacesMap> =
  `user:${string}@${TNamespace}`
