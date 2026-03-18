import { QueueClientEventsMap, QueueServerEventsMap } from '@magic3t/api-types'
import { DefaultEventsMap, Server, Socket } from 'socket.io'

export type QueueSocket = Socket<QueueClientEventsMap, QueueServerEventsMap, DefaultEventsMap>
export type QueueServer = Server<QueueClientEventsMap, QueueServerEventsMap, DefaultEventsMap>
