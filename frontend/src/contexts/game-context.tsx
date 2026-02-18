import {
  GameClientEventsMap,
  GameServerEventsMap,
  GetUserResult,
  MatchClientEvents,
  MatchReportPayload,
  MatchServerEvents,
} from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useGateway } from '@/hooks/use-gateway'
import { useListener } from '@/hooks/use-listener'
import { useObservable } from '@/hooks/use-observable'
import { Console } from '@/lib/console'
import { Timer } from '@/lib/Timer'
import { apiClient } from '@/services/clients/api-client'
import { AuthState, useAuth } from './auth-context'

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
  const client = useQueryClient()
  const [matchId, setMatchId] = useState<string | null>(null)
  const isActive = !!matchId
  const [orderId, setOrderId] = useState<null | string>(null)
  const [chaosId, setChaosId] = useState<null | string>(null)
  const orderQuery = useQuery({
    queryKey: ['user', orderId],
    queryFn: async () => {
      if (!orderId) return null
      return apiClient.user.getById(orderId)
    },
    initialData: null,
  })
  const chaosQuery = useQuery({
    queryKey: ['user', chaosId],
    queryFn: async () => {
      if (!chaosId) return null
      return apiClient.user.getById(chaosId)
    },
    initialData: null,
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
  useListener(gateway, MatchServerEvents.Message, (message) => {
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
    MatchServerEvents.Assignments,
    (assignments) => {
      setOrderId(assignments[Team.Order].profile.id)
      setChaosId(assignments[Team.Chaos].profile.id)

      if (assignments[Team.Order].profile.id === auth.user?.id) {
        setCurrentTeam(Team.Order)
      } else if (assignments[Team.Chaos].profile.id === auth.user?.id) {
        setCurrentTeam(Team.Chaos)
      } else {
        setCurrentTeam(null)
      }
    },
    [auth.user?.id]
  )

  // Handles state updates from the server.
  useListener(gateway, MatchServerEvents.StateReport, (report) => {
    setTurn(report.turn)
    setOrderChoices(report[Team.Order].choices)
    setChaosChoices(report[Team.Chaos].choices)
    orderTimer.current.pause()
    chaosTimer.current.pause()
    orderTimer.current.setRemaining(report[Team.Order].timeLeft)
    chaosTimer.current.setRemaining(report[Team.Chaos].timeLeft)

    if (report.turn === Team.Order) {
      orderTimer.current.start()
    } else if (report.turn === Team.Chaos) {
      chaosTimer.current.start()
    }
  })

  // Handles final match reports from the server.
  useListener(
    gateway,
    MatchServerEvents.MatchReport,
    (report) => {
      if (!auth.signedIn) return
      client.setQueryData(['user', orderId], (oldData: GetUserResult | null) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          rating: report[Team.Order].newRating,
        }
      })
      client.setQueryData(['user', chaosId], (oldData: GetUserResult | null) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          rating: report[Team.Chaos].newRating,
        }
      })
      setFinalReport(report)
      emitFinishMatch(report)
      auth.refetchUser()
    },
    [gateway.socket, auth.userId]
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

    gateway.emit(MatchClientEvents.GetState)
    gateway.emit(MatchClientEvents.GetAssignments)
  }, [matchId, gateway])

  useListener(gateway, 'disconnect', (reason) => {
    console.error('Socket disconnected because of', `${reason}.`)
    Console.log(`Socket disconnected because of ${reason}.`)
  })

  const pick = useCallback(
    (choice: Choice) => {
      if (currentTeam === null) return
      if (currentTeam !== turn) return
      gateway.emit(MatchClientEvents.Pick, choice)
      switch (currentTeam) {
        case Team.Order: {
          setOrderChoices((old) => [...old, choice])
          setTurn(Team.Chaos)
          orderTimer.current.pause()
          chaosTimer.current.start()
          break
        }
        case Team.Chaos: {
          setChaosChoices((old) => [...old, choice])
          setTurn(Team.Order)
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

        gateway.emit(MatchClientEvents.Message, message)
      }
    },
    [gateway]
  )

  const forfeit = useCallback(async () => {
    if (currentTeam === null) return
    if (finalReport) return

    Console.log('You surrendered the match.')

    gateway.emit(MatchClientEvents.Surrender)
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
          [Team.Order]: {
            choices: orderChoices,
            profile: orderProfile,
            timer: orderTimer.current,
            gain: finalReport?.[Team.Order].lpGain || null,
            score: finalReport?.[Team.Order].score || null,
          },
          [Team.Chaos]: {
            choices: chaosChoices,
            profile: chaosProfile,
            timer: chaosTimer.current,
            gain: finalReport?.[Team.Chaos].lpGain || null,
            score: finalReport?.[Team.Chaos].score || null,
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
