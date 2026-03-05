import { DefaultEventsMap, Socket } from 'socket.io'
import { SessionData } from '@/shared/types/session-data'

export type AuthenticSocketData = {
  session: SessionData
}

export type AuthenticSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  AuthenticSocketData
>
