import { createFileRoute } from '@tanstack/react-router'
import { GameTemplate, LobbyTemplate } from '@/components/templates'
import { useGame } from '@/contexts/game-context'

export const Route = createFileRoute('/_auth-guard/')({
  component: () => {
    const { isActive } = useGame()

    return isActive ? <GameTemplate /> : <LobbyTemplate />
  },
})
