import { League, Team } from '@magic3t/common-types'
import { UserRole } from '@magic3t/database-types'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { GameContext, GameContextData } from '@/contexts/game-context'
import { Timer } from '@/lib/Timer'
import { GameTemplate } from './game-template'

export default {
  title: 'Templates/Game',
}

// Mock router for Ladle
const rootRoute = createRootRoute({
  component: () => (
    <GameContext value={MOCK_GAME_CONTEXT_DATA}>
      <div className="flex flex-col">
        <GameTemplate />
      </div>
    </GameContext>
  ),
})

const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory(),
})

const MOCK_GAME_CONTEXT_DATA: GameContextData = {
  matchId: 'match-abc123def456',
  isActive: true,
  turn: Team.Order,
  currentTeam: Team.Order,
  availableChoices: [4, 5, 6, 7, 8],
  finished: false,
  finalReport: null,
  teams: {
    [Team.Order]: {
      timer: new Timer(45),
      profile: {
        id: 'player-order-1',
        nickname: 'OrderMaster',
        summonerIcon: 1,
        role: UserRole.Player,
        rating: {
          league: League.Gold,
          division: 2,
          points: 75,
          progress: 0.75,
        },
        stats: {
          wins: 45,
          draws: 8,
          defeats: 12,
        },
      },
      choices: [1, 2, 3],
      gain: null,
      score: null,
    },
    [Team.Chaos]: {
      timer: new Timer(30),
      profile: {
        id: 'player-chaos-2',
        nickname: 'ChaosPrincess',
        summonerIcon: 3,
        role: UserRole.Player,
        rating: {
          league: League.Silver,
          division: 1,
          points: 60,
          progress: 0.6,
        },
        stats: {
          wins: 32,
          draws: 5,
          defeats: 18,
        },
      },
      choices: [9],
      gain: null,
      score: null,
    },
  },
  connect: () => {},
  disconnect: () => {},
  pick: () => {},
  sendMessage: () => {},
  forfeit: () => {},
  onMatchReport: () => {},
}

export const Default = () => <RouterProvider router={router} />
