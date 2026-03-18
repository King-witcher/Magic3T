import {
  EventsMap,
  ReservedOrUserEventNames,
  ReservedOrUserListener,
} from '@socket.io/component-emitter'
import { DependencyList, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { Console } from '@/lib/console'
import { Gateway } from './use-gateway'

export type DisconnectDescription =
  | Error
  | {
      description: string
      context?: unknown
    }

interface SocketReservedEvents {
  connect: () => void
  connect_error: (err: Error) => void
  disconnect: (reason: Socket.DisconnectReason, description?: DisconnectDescription) => void
}

export function useListener<
  ServerEventsMap extends EventsMap,
  ClientEventsMap extends EventsMap,
  Ev extends ReservedOrUserEventNames<SocketReservedEvents, ServerEventsMap>,
>(
  gateway: Gateway<ServerEventsMap, ClientEventsMap>,
  event: Ev,
  listener: ReservedOrUserListener<SocketReservedEvents, ServerEventsMap, Ev>,
  deps: DependencyList = []
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: I already have a dependency list
  useEffect(() => {
    if (!gateway.socket) return
    Console.log(`Subscribed to ${gateway.name}::${event.toString()}`)
    const socket = gateway.socket
    // biome-ignore lint/suspicious/noExplicitAny: There is no other way to type this
    socket.on(event, <any>listener)
    return () => {
      Console.log(`Unsubscribed from ${gateway.name}::${event.toString()}`)
      // biome-ignore lint/suspicious/noExplicitAny: There is no other way to type this
      socket.off(event, <any>listener)
    }
  }, [gateway, event, ...deps])
}
