import {
  GameClientEventsMap,
  GameServerEventsMap,
  GetUserResult,
  MatchReportPayload,
} from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useClientQuery } from '@/hooks/use-client-query'
import { useGateway } from '@/hooks/use-gateway'
import { useListener } from '@/hooks/use-listener'
import { useObservable } from '@/hooks/use-observable'
import { Console } from '@/lib/console'
import { Timer } from '@/lib/timer'
import { apiClient } from '@/services/clients/api-client'
import { AuthState, useAuth } from './auth/auth-context'

type Message = { sender: 'you' | 'him'; content: string; timestamp: number }

export type GameContextData = {
  matchId: string | null
  isActive: boolean
  turn: Team | null
  currentTeam: Team | null
  availableChoices: Choice[]
  finished: boolean
  finalReport: MatchReportPayload | null
  teams: Record<
    Team,
    {
      timer: Timer
      profile: GetUserResult | null
      choices: Choice[]
      gain: number | null
      score: number | null
    }
  >

  connect(id: string): void
  disconnect(): void

  pick(choice: Choice): void
  sendMessage(message: string): void
  forfeit(): void

  onMatchReport(callback: (report: MatchReportPayload) => void): void
}

interface Props {
  children?: ReactNode
}

export const GameContext = createContext<GameContextData | null>(null)

// Refactor this and use white and black isntead of player and opponent
export function GameProvider({ children }: Props) {
  const auth = useAuth()
  const [matchId, setMatchId] = useState<string | null>(null)
  const isActive = !!matchId
  const [orderId, setOrderId] = useState<null | string>(null)
  const [chaosId, setChaosId] = useState<null | string>(null)
  const orderQuery = useClientQuery(apiClient.user, 'getById', orderId!, {
    enabled: !!orderId,
  })
  const chaosQuery = useClientQuery(apiClient.user, 'getById', chaosId!, {
    enabled: !!chaosId,
  })

  const orderProfile = orderQuery.data
  const chaosProfile = chaosQuery.data

  const [orderChoices, setOrderChoices] = useState<Choice[]>([])
  const [chaosChoices, setChaosChoices] = useState<Choice[]>([])
  const [turn, setTurn] = useState<Team | null>(null)
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [_messages, setMessages] = useState<Message[]>([])
  const [finalReport, setFinalReport] = useState<MatchReportPayload | null>(null)
  const [subscribeFinishMatch, emitFinishMatch] = useObservable<MatchReportPayload>()

  const orderTimer = useRef(new Timer(0))
  const chaosTimer = useRef(new Timer(0))

  const { state: authState } = useAuth()
  const gateway = useGateway<GameServerEventsMap, GameClientEventsMap>(
    'match',
    authState === AuthState.SignedIn
  )

  // Handles text messages from the server. To be done.
  useListener(gateway, 'message', (message) => {
    setMessages((current) => [
      ...current,
      {
        timestamp: Date.now(),
        content: message.message,
        sender: 'him',
      },
    ])
  })

  // Handles team assignments messages from the server.
  useListener(
    gateway,
    'assignments',
    (assignments) => {
      setOrderId(assignments.order.profile.id)
      setChaosId(assignments.chaos.profile.id)

      if (assignments.order.profile.id === auth.uuid) {
        setCurrentTeam('order')
      } else if (assignments.chaos.profile.id === auth.uuid) {
        setCurrentTeam('chaos')
      } else {
        setCurrentTeam(null)
      }
    },
    [auth.uuid]
  )

  // Handles state updates from the server.
  useListener(gateway, 'state-report', (report) => {
    setTurn(report.turn)
    setOrderChoices(report.order.choices)
    setChaosChoices(report.chaos.choices)
    orderTimer.current.pause()
    chaosTimer.current.pause()
    orderTimer.current.setRemaining(report.order.timeLeft)
    chaosTimer.current.setRemaining(report.chaos.timeLeft)

    if (report.turn === 'order') {
      orderTimer.current.start()
    } else if (report.turn === 'chaos') {
      chaosTimer.current.start()
    }
  })

  // Handles final match reports from the server.
  useListener(
    gateway,
    'match-report',
    (report) => {
      if (!auth.signedIn) return
      if (orderQuery.data) {
        orderQuery.setData((oldData) => ({
          ...oldData!,
          rank: report.order.newRank,
        }))
      }
      if (chaosQuery.data) {
        chaosQuery.setData((oldData) => ({
          ...oldData!,
          rank: report.chaos.newRank,
        }))
      }
      setFinalReport(report)
      emitFinishMatch(report)
      // auth.refetchUser()
    },
    [gateway.socket, auth.uuid]
  )

  // Refactor with keys
  const resetState = useCallback(() => {
    setMatchId(null)
    setTurn(null)
    setMessages([])
    orderTimer.current.pause()
    chaosTimer.current.pause()
    orderTimer.current.setRemaining(0)
    chaosTimer.current.setRemaining(0)
    setOrderId(null)
    setChaosId(null)
    setOrderChoices([])
    setChaosChoices([])
    setFinalReport(null)
    setCurrentTeam(null)
  }, [])

  // Requests game state and game assignments whenever a new game starts.
  useEffect(() => {
    if (!matchId) return
    if (!gateway.socket) return

    gateway.emit('get-state')
    gateway.emit('get-assignments')
  }, [matchId, gateway])

  useListener(gateway, 'disconnect', (reason) => {
    console.error('Socket disconnected because of', `${reason}.`)
    Console.log(`Socket disconnected because of ${reason}.`)
  })

  const pick = useCallback(
    (choice: Choice) => {
      if (currentTeam === null) return
      if (currentTeam !== turn) return
      gateway.emit('pick', choice)
      switch (currentTeam) {
        case 'order': {
          setOrderChoices((old) => [...old, choice])
          setTurn('chaos')
          orderTimer.current.pause()
          chaosTimer.current.start()
          break
        }
        case 'chaos': {
          setChaosChoices((old) => [...old, choice])
          setTurn('order')
          chaosTimer.current.pause()
          orderTimer.current.start()
          break
        }
      }
    },
    [currentTeam, turn, gateway.emit]
  )

  const sendMessage = useCallback(
    (message: string) => {
      if (gateway.socket) {
        setMessages((current) => [
          ...current,
          {
            content: message,
            sender: 'you',
            timestamp: Date.now(),
          },
        ])

        gateway.emit('message', message)
      }
    },
    [gateway]
  )

  const forfeit = useCallback(async () => {
    if (currentTeam === null) return
    if (finalReport) return

    Console.log('You surrendered the match.')

    gateway.emit('surrender')
    setTurn(null)
    orderTimer.current.pause()
    chaosTimer.current.pause()
  }, [currentTeam, finalReport, gateway])

  // Sets the state as connected to a game by just setting a matchId different from null.
  const connectGame = useCallback(
    (matchId: string) => {
      Console.log(`Connected to match ${matchId}.`)
      Console.log()
      resetState()
      setMatchId(matchId)
    },
    [resetState]
  )

  function disconnect() {
    setMatchId(null)
    resetState()
  }

  const availableChoices = useMemo(() => {
    if (!isActive) return []
    const availableChoices: Choice[] = []
    for (let i = 1; i < 10; i++) {
      if (!orderChoices.includes(i as Choice) && !chaosChoices.includes(i as Choice))
        availableChoices.push(i as Choice)
    }
    return availableChoices
  }, [orderChoices, chaosChoices, isActive])

  // If the player was currently in a game, auto connects him to the game when he logs in.
  useEffect(() => {
    async function checkStatus() {
      try {
        if (authState !== AuthState.SignedIn) return
        const { id } = await apiClient.match.getCurrentMatch()
        await connectGame(id)
      } catch (e) {
        console.error(e)
        Console.log((e as unknown as Error).message)
      }
    }

    checkStatus()
  }, [connectGame, authState])

  return (
    <GameContext
      value={{
        teams: {
          order: {
            choices: orderChoices,
            profile: orderProfile ?? null,
            timer: orderTimer.current,
            gain: finalReport?.order.lpGain || null,
            score: finalReport?.order.score || null,
          },
          chaos: {
            choices: chaosChoices,
            profile: chaosProfile ?? null,
            timer: chaosTimer.current,
            gain: finalReport?.chaos.lpGain || null,
            score: finalReport?.chaos.score || null,
          },
        },
        availableChoices,
        isActive,
        matchId,
        finalReport,
        currentTeam,
        finished: !!finalReport,
        turn,
        connect: connectGame,
        disconnect,
        forfeit,
        pick,
        sendMessage,
        onMatchReport: subscribeFinishMatch,
      }}
    >
      {children}
    </GameContext>
  )
}

export function useGame(): GameContextData {
  const context = use(GameContext)
  if (!context) throw new Error('useGame must be used within a GameProvider')
  return context
}
