import { EventNames, EventParams, EventsMap } from '@socket.io/component-emitter'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth/auth-context'
import { Console, SystemCvars } from '@/lib/console'
import { firebaseClient } from '@/lib/firebase-client'

export type Gateway<ServerEvents extends EventsMap, ClientEvents extends EventsMap> = {
  readonly name: string
  readonly socket: Socket<ServerEvents, ClientEvents> | null
  emit<Ev extends EventNames<ClientEvents>>(event: Ev, ...data: EventParams<ClientEvents, Ev>): void
}

export function useGateway<ServerEvents extends EventsMap, ClientEvents extends EventsMap>(
  gateway: string,
  enabled = true
): Gateway<ServerEvents, ClientEvents> {
  const [socket, setSocket] = useState<Socket<ServerEvents, ClientEvents> | null>(null)
  const auth = useAuth()
  const apiurl = Console.useCvar(SystemCvars.SvApiUrl)
  const logEnabled = Boolean(Console.useCvar(SystemCvars.SvLogWs))

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancel = false
    let socket: Socket | null = null
    Console.log(`Connecting to gateway ${gateway}...`)
    firebaseClient.token.then((token) => {
      if (cancel) return
      socket = io(`${apiurl}/${gateway}`, {
        auth: {
          token,
        },
        transports: ['websocket'],
      })
      Console.log(`Connected to gateway '${gateway}'`)

      setSocket(socket)
    })

    return () => {
      cancel = true
      socket?.disconnect()
      setSocket(null)
    }
  }, [gateway, enabled, auth.uuid, apiurl])

  useEffect(
    function logSocketConnection() {
      if (!socket || !logEnabled) return () => {}
      function logger(event: string, ...args: unknown[]) {
        Console.log(`Received ${gateway}::${event}:`)
        Console.log(JSON.stringify(args, null, 2))
      }

      socket.onAny(logger)
      return () => {
        socket.offAny(logger)
      }
    },
    [gateway, socket, logEnabled]
  )

  const emit = useCallback(
    <Ev extends EventNames<ClientEvents>>(
      event: Ev,
      ...data: EventParams<ClientEvents, Ev>
    ): void => {
      if (!socket) {
        Console.log(
          `Socket for "${gateway}" gateway is disabled and event "${event.toString()}" will not be sent.`
        )
        return
      }

      if (logEnabled) {
        Console.log(`Emitting ${gateway}::${event.toString()}:`)
        Console.log(JSON.stringify(data, null, 2))
      }

      socket.emit(event, ...data)
    },
    [gateway, socket, logEnabled]
  )

  return useMemo(
    () => ({
      name: gateway,
      socket,
      emit,
    }),
    [gateway, socket, emit]
  )
}
