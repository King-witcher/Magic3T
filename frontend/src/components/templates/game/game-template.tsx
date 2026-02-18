import { Team } from '@magic3t/common-types'
import { useEffect } from 'react'
import { GiCrossedSwords } from 'react-icons/gi'
import { Button, Panel } from '@/components/atoms'
import { useGame } from '@/contexts/game-context'
import { useDialogStore } from '@/contexts/modal-store'
import { cn } from '@/lib/utils'
import { GameBoard } from '../../molecules/game-board'
import { GameResultModal } from './components/game-result-modal'
import { PlayerPanel } from './components/player-panel'
import { SurrenderModal } from './components/surrender-modal'

export function GameTemplate() {
  const gameCtx = useGame()
  const showDialog = useDialogStore((state) => state.showDialog)
  // const chatInputRef = useRef<HTMLInputElement>(null)

  // Current player's team and opponent's team
  const myTeam = gameCtx.currentTeam || Team.Order
  const enemyTeam = (1 - myTeam) as Team
  const myPlayer = gameCtx.teams[myTeam]
  const enemyPlayer = gameCtx.teams[enemyTeam]

  // Is it my turn?
  const isMyTurn = gameCtx.turn !== null && gameCtx.turn === gameCtx.currentTeam

  // Show result modal when game ends
  useEffect(() => {
    return gameCtx.onMatchReport(() => {
      setTimeout(() => {
        showDialog(<GameResultModal />, { closeOnOutsideClick: true })
      }, 500)
    })
  }, [gameCtx, showDialog])

  const handleSurrender = () => {
    showDialog(<SurrenderModal onClose={() => {}} />, {
      closeOnOutsideClick: true,
    })
  }

  if (!gameCtx.isActive) return null

  return (
    <div className="flex items-center justify-center min-h-full p-4 md:p-8">
      <Panel className="max-w-full w-fit self-stretch flex flex-col gap-4 p-6">
        {/* Main game area */}
        <div className="flex flex-col items-center justify-between gap-4 flex-1">
          {/* Enemy Player Panel */}
          <PlayerPanel
            profile={enemyPlayer.profile}
            timer={enemyPlayer.timer}
            isPaused={gameCtx.turn === null}
            isActive={gameCtx.turn === enemyTeam}
            position="top"
            lpGain={enemyPlayer.gain}
          />

          {/* VS Divider */}
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-gold-5/50 to-gold-5/50" />
            <GiCrossedSwords className="text-gold-4 text-2xl" />
            <div className="flex-1 h-px bg-linear-to-l from-transparent via-gold-5/50 to-gold-5/50" />
          </div>

          {/* Game Board */}
          <GameBoard
            allyChoices={myPlayer.choices}
            enemyChoices={enemyPlayer.choices}
            isMyTurn={isMyTurn}
            isGameOver={gameCtx.finished}
            onPick={gameCtx.pick}
          />

          {/* Turn indicator */}
          {!gameCtx.finished && (
            <div
              className={cn(
                'px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wider',
                'border-2 transition-all duration-300',
                isMyTurn
                  ? 'bg-blue-600/20 border-blue-400/50 text-blue-300'
                  : 'bg-red-600/20 border-red-400/50 text-red-300'
              )}
            >
              {isMyTurn ? 'Your Turn - Select a Number' : "Waiting for Opponent's Move"}
            </div>
          )}

          {/* VS Divider */}
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-gold-5/50 to-gold-5/50" />
            <GiCrossedSwords className="text-gold-4 text-2xl" />
            <div className="flex-1 h-px bg-linear-to-l from-transparent via-gold-5/50 to-gold-5/50" />
          </div>

          {/* My Player Panel */}
          <PlayerPanel
            profile={myPlayer.profile}
            timer={myPlayer.timer}
            isPaused={gameCtx.turn === null}
            isActive={gameCtx.turn === myTeam}
            position="bottom"
            lpGain={myPlayer.gain}
            showSurrender={!gameCtx.finished}
            onSurrender={handleSurrender}
          />
        </div>

        {/* Leave button when game is finished */}
        {gameCtx.finished && (
          <div className="flex justify-center">
            <Button variant="secondary" size="lg" onClick={gameCtx.disconnect}>
              Leave Room
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
