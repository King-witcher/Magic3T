import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { GameContext, GameContextData } from '@/contexts/game-context'
import { Timer } from '@/lib/timer'
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
  turn: 'order',
  currentTeam: 'order',
  availableChoices: [4, 5, 6, 7, 8],
  finished: false,
  finalReport: null,
  teams: {
    order: {
      timer: new Timer(45),
      profile: {
        id: 'player-order-1',
        nickname: 'OrderMaster',
        summonerIcon: 1,
        role: 'player',
        rank: {
          division: 4,
          league: 'diamond',
          lp: 50,
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
    chaos: {
      timer: new Timer(30),
      profile: {
        id: 'player-chaos-2',
        nickname: 'ChaosPrincess',
        summonerIcon: 3,
        role: 'player',
        rank: {
          division: 4,
          league: 'diamond',
          lp: 50,
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
