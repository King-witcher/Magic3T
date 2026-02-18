import {
  QueueClientEvents,
  QueueClientEventsMap,
  QueueServerEvents,
  QueueServerEventsMap,
  UpdateUserCountPayload,
} from '@magic3t/api-types'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useGateway } from '@/hooks/use-gateway.ts'
import { useListener } from '@/hooks/use-listener.ts'
import { apiClient } from '@/services/clients/api-client.ts'
import { QueueMode } from '@/types/queue.ts'
import { AuthState, useAuth } from './auth-context.tsx'
import { useGame } from './game-context.tsx'

export type QueueModesType = {
  'bot-0'?: boolean
  'bot-1'?: boolean
  'bot-2'?: boolean
  'bot-3'?: boolean
  casual?: boolean
  ranked?: boolean
}

interface QueueContextData {
  enqueue(mode: QueueMode): void
  dequeue(mode: QueueMode): void
  queueModes: QueueModesType
  queueUserCount: UpdateUserCountPayload
}

interface QueueContextProps {
  children: ReactNode
}

const QueueContext = createContext<QueueContextData>({} as QueueContextData)

export function QueueProvider({ children }: QueueContextProps) {
  const [queueModes, setQueueModes] = useState<QueueModesType>({})
  const [queueUserCount, setQueueUserCount] = useState<UpdateUserCountPayload>({
    casual: {
      inGame: Number.NaN,
      queue: 0,
    },
    connected: 0,
    ranked: {
      inGame: Number.NaN,
      queue: 0,
    },
  })
  const { user, state: authState } = useAuth()
  const gameCtx = useGame()

  const gateway = useGateway<QueueServerEventsMap, QueueClientEventsMap>(
    'queue',
    authState === AuthState.SignedIn
  )

  useListener(gateway, QueueServerEvents.MatchFound, (data) => {
    setQueueModes({})
    gameCtx.connect(data.matchId)
  })

  useListener(gateway, QueueServerEvents.UserCount, (data) => {
    setQueueUserCount(data)
  })

  useListener(gateway, QueueServerEvents.QueueModes, (data) => {
    setQueueModes(data)
  })

  useListener(gateway, 'disconnect', () => {
    setQueueModes({})
    setQueueUserCount({
      casual: {
        queue: 0,
        inGame: 0,
      },
      ranked: {
        queue: 0,
        inGame: 0,
      },
      connected: 0,
    })
  })

  useEffect(() => {
    gateway.emit(QueueClientEvents.Interact)
  }, [gateway])

  const enqueue = useCallback(
    async (mode: QueueMode) => {
      setQueueModes((current) => ({
        ...current,
        [mode]: true,
      }))

      await apiClient.queue.enqueue(mode)
    },
    [gateway, user, setQueueModes]
  )

  const dequeue = useCallback(
    async (mode: QueueMode) => {
      await apiClient.queue.dequeue()
      setQueueModes((current) => ({
        ...current,
        [mode]: false,
      }))
    },
    [gateway]
  )

  return (
    <QueueContext.Provider value={{ enqueue, dequeue, queueModes, queueUserCount }}>
      {children}
    </QueueContext.Provider>
  )
}

export const useQueue = () => useContext(QueueContext)
