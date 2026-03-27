import {
  LiveGameStatsPayload,
  QueueClientEvents,
  QueueClientEventsMap,
  QueueServerEvents,
  QueueServerEventsMap,
} from '@magic3t/api-types'
import { BotId } from '@magic3t/common-types'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useClientMutation } from '@/hooks/use-client-mutation'
import { useGateway } from '@/hooks/use-gateway.ts'
import { useListener } from '@/hooks/use-listener.ts'
import { apiClient } from '@/services/clients/api-client.ts'
import { AuthState, useAuth } from './auth/auth-context.tsx'
import { useGame } from './game-context.tsx'

export type QueueModesType = {
  ranked: {
    [botId in BotId | 'pvp']: boolean
  }
}

const emptyQueueModes: QueueModesType = {
  ranked: {
    pvp: false,
    [BotId.Recruit]: false,
    [BotId.Soldier]: false,
    [BotId.Elite]: false,
    [BotId.Legend]: false,
  },
}

interface QueueContextData {
  enqueue(): void
  joinBot(bot: BotId): void
  leaveQueue(): Promise<void>
  queueModes: QueueModesType
  queueUserCount: LiveGameStatsPayload
}

interface QueueContextProps {
  children: ReactNode
}

const QueueContext = createContext<QueueContextData | null>(null)

export function QueueProvider({ children }: QueueContextProps) {
  const [queueModes, setQueueModes] = useState<QueueModesType>(emptyQueueModes)

  const [queueUserCount, setQueueUserCount] = useState<LiveGameStatsPayload>({
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
  const { state: authState } = useAuth()
  const gameCtx = useGame()

  const gateway = useGateway<QueueServerEventsMap, QueueClientEventsMap>(
    'queue',
    authState === AuthState.SignedIn
  )

  useListener(gateway, QueueServerEvents.MatchFound, (data) => {
    setQueueModes(emptyQueueModes)
    gameCtx.connect(data.matchId)
  })

  useListener(gateway, QueueServerEvents.LiveGameStats, (data) => {
    setQueueUserCount(data)
  })

  useListener(gateway, QueueServerEvents.QueueModes, (data) => {
    if (!data.ranked) {
      setQueueModes(emptyQueueModes)
    }
  })

  useListener(gateway, 'disconnect', () => {
    setQueueModes(emptyQueueModes)
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

  const enqueueMutation = useClientMutation(apiClient.queue, 'enqueue', {
    onMutate: () => {
      setQueueModes((current) => ({
        ...current,
        ranked: { ...current.ranked, pvp: true },
      }))
    },
    onError: () => {
      setQueueModes((current) => ({
        ...current,
        ranked: { ...current.ranked, pvp: false },
      }))
      toast.error('Failed to join queue. Please try again.')
    },
  })

  const joinBotMutation = useClientMutation(apiClient.queue, 'joinBot', {
    onMutate: (bot) => {
      setQueueModes((current) => ({
        ...current,
        ranked: { ...current.ranked, [bot]: true },
      }))
    },
    onError: (_error, bot) => {
      setQueueModes((current) => ({
        ...current,
        ranked: { ...current.ranked, [bot]: false },
      }))
      toast.error('Failed to start bot match. Please try again.')
    },
  })

  const enqueue = useCallback(() => enqueueMutation.mutate(), [enqueueMutation])
  const joinBot = useCallback((bot: BotId) => joinBotMutation.mutate(bot), [joinBotMutation])

  const dequeue = useCallback(async () => {
    await apiClient.queue.dequeue()
    setQueueModes(emptyQueueModes)
  }, [setQueueModes])

  return (
    <QueueContext.Provider
      value={{ enqueue, joinBot, leaveQueue: dequeue, queueModes, queueUserCount }}
    >
      {children}
    </QueueContext.Provider>
  )
}

export const useQueue = () => {
  const context = useContext(QueueContext)
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider')
  }
  return context
}
