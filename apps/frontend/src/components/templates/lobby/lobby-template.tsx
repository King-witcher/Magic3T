import { BotId } from '@magic3t/common-types'
import {
  GiArtificialHive,
  GiArtificialIntelligence,
  GiBrain,
  GiGoose,
  GiRobotGrab,
} from 'react-icons/gi'
import { IoMdPeople } from 'react-icons/io'
import { Panel, PanelDivider } from '@/components/ui/panel'
import { useQueue } from '@/contexts/queue-context'
import { GameModeCard } from './game-mode-card'

export function LobbyTemplate() {
  const { queueUserCount } = useQueue()

  return (
    <div className="flex items-center justify-center min-h-full p-4 md:p-8">
      {/* Header Section */}

      {/* Game Modes Section */}
      <Panel className="max-w-300">
        <div className="space-y-4">
          {/* VS Players Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gold-4/30 pb-3">
              <IoMdPeople className="text-gold-3 text-3xl" />
              <h2 className="font-serif font-bold text-2xl text-gold-2 uppercase tracking-wide">
                Face Real Opponents
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <GameModeCard
                mode="pvp"
                title="PvP Match"
                description="Compete against real players. Prove your mastery and climb the ranks!"
                icon={<IoMdPeople className="text-blue-400" />}
                playersInQueue={queueUserCount.ranked.queue}
                variant="pvp"
              />
            </div>
          </div>

          {/* Divider */}
          <PanelDivider />

          {/* VS Bots Section */}
          <div className="flex items-center gap-3 border-b border-gold-4/30 pb-3">
            <GiRobotGrab className="text-gold-3 text-3xl" />
            <h2 className="font-serif font-bold text-2xl text-gold-2 uppercase tracking-wide">
              Train Against Bots
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GameModeCard
              mode={BotId.Recruit}
              title="Recruit"
              description="Perfect for learning the basics. The bot makes random moves."
              icon={<GiGoose className="text-green-400" />}
              difficulty="easy"
              variant="bot"
            />

            <GameModeCard
              mode={BotId.Soldier}
              title="Soldier"
              description="A moderate challenge. The bot thinks a few moves ahead."
              icon={<GiArtificialIntelligence className="text-yellow-400" />}
              difficulty="medium"
              variant="bot"
            />

            <GameModeCard
              mode={BotId.Elite}
              title="Elite"
              description="A faster opponent. The bot plans multiple moves ahead."
              icon={<GiBrain className="text-orange-400" />}
              difficulty="hard"
              variant="bot"
            />

            <GameModeCard
              mode={BotId.Legend}
              title="Legend"
              description="The ultimate challenge. An invincible strategic mastermind."
              icon={<GiArtificialHive className="text-red-400" />}
              difficulty="unbeatable"
              variant="bot"
            />
          </div>
        </div>
      </Panel>
    </div>
  )
}
