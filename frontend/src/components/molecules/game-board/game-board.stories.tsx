import type { Story } from '@ladle/react'
import type { Choice } from '@magic3t/common-types'
import { useState } from 'react'
import { GameBoard } from '.'

export default {
  title: 'Templates/Game/GameBoard',
}

export const EmptyBoard: Story = () => {
  const [allyChoices, setAllyChoices] = useState<Choice[]>([])
  const [enemyChoices, setEnemyChoices] = useState<Choice[]>([])
  const [turn, setTurn] = useState<'ally' | 'enemy'>('ally')

  const handleSelect = (choice: Choice) => {
    if (turn === 'ally') {
      setAllyChoices((prev) => [...prev, choice])
      setTurn('enemy')
    } else {
      setEnemyChoices((prev) => [...prev, choice])
      setTurn('ally')
    }
  }

  return (
    <GameBoard
      allyChoices={allyChoices}
      enemyChoices={enemyChoices}
      isMyTurn={true}
      isGameOver={false}
      onPick={handleSelect}
    />
  )
}

export const EnemysTurn: Story = () => {
  return (
    <GameBoard
      allyChoices={[1, 5, 6]}
      enemyChoices={[2, 3]}
      isMyTurn={false}
      isGameOver={false}
      onPick={() => {}}
    />
  )
}

export const AllyWins: Story = () => {
  return (
    <GameBoard
      allyChoices={[1, 5, 9]} // Winning combination
      enemyChoices={[2, 3]}
      isMyTurn={false}
      isGameOver={true}
      onPick={() => {}}
    />
  )
}

export const EnemyWins: Story = () => {
  return (
    <GameBoard
      allyChoices={[1, 4]}
      enemyChoices={[2, 5, 8]} // Winning combination
      isMyTurn={false}
      isGameOver={true}
      onPick={() => {}}
    />
  )
}

export const Draw: Story = () => {
  return (
    <GameBoard
      allyChoices={[1, 7, 5, 8, 4]}
      enemyChoices={[2, 3, 6, 9]}
      isMyTurn={false}
      isGameOver={true}
      onPick={() => {}}
    />
  )
}
