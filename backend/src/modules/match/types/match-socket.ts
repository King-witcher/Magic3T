import { GameClientEventsMap, GameServerEventsMap } from '@magic3t/api-types'
import { DefaultEventsMap, Socket } from 'socket.io'
import { AuthenticSocketData } from '@/modules/auth/authentic-socket'
import { Perspective } from '../lib/perspective'

export type MatchSocketData = AuthenticSocketData & {
  perspective: Perspective
}

export type MatchSocket = Socket<
  GameClientEventsMap,
  GameServerEventsMap,
  DefaultEventsMap,
  MatchSocketData
>
