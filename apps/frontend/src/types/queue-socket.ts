import { QueueClientEventsMap, QueueServerEventsMap } from '@magic3t/api-types'
import type { Socket } from 'socket.io-client'

export type QueueSocket = Socket<QueueServerEventsMap, QueueClientEventsMap>
