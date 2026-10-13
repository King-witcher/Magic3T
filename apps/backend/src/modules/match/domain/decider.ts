import { Choice } from '@magic3t/common-types'
import { opposite } from '@/shared/opposite'
import { MatchRuleError } from './match-rule-error'
import { MatchCommand, MatchEvent, MatchState, Outcome } from './types'

// Decider pattern

/**
 * Apenas retorna uma lista de eventos causados por um comando, sem alterar o state. O state é
 * alterado pela função `evolve`.
 * Now representa quantos ms se passaram desde o início da partida.
 */
export function decide(state: MatchState, cmd: MatchCommand, now: number): MatchEvent[] {
  if (state.phase.status !== 'ongoing') throw new MatchRuleError('MatchFinished')

  const events: MatchEvent[] = []

  switch (cmd.type) {
    case 'pick': {
      if (state.phase.turn !== cmd.team) throw new MatchRuleError('WrongTurn')
      if (state.choices.order.includes(cmd.value) || state.choices.chaos.includes(cmd.value))
        throw new MatchRuleError('ChoiceUnavailable')

      const elapsed = state.timeSpent[state.phase.turn] + (now - state.phase.turnStartedAt)
      // Race condition
      if (elapsed >= state.timelimit) return []

      const event: MatchEvent = {
        type: 'choice-made',
        team: cmd.team,
        choice: cmd.value,
        outcome: null,
        at: now,
      }
      events.push(event)

      const nextState = evolve(state, event)
      event.outcome = checkChoicesOutcome(nextState)

      break
    }

    case 'surrender': {
      events.push({
        type: 'surrendered',
        team: cmd.team,
        at: now,
      })

      break
    }

    case 'timeout': {
      events.push({
        type: 'timed-out',
        team: state.phase.turn,
        at: now,
      })

      break
    }

    default: {
      throw new Error(`invalid command`)
    }
  }

  return events
}

/** Returns a new state without changing the original one */
export function evolve(state: MatchState, ev: MatchEvent): MatchState {
  // Only ongoing matches can evolve state
  if (state.phase.status !== 'ongoing') throw new MatchRuleError('MatchFinished')

  const newState: MatchState = {
    choices: {
      chaos: [...state.choices.chaos],
      order: [...state.choices.order],
    },
    phase: {
      // Seguro porque já garantimos status ongoing
      ...state.phase,
    },
    timelimit: state.timelimit,
    timeSpent: {
      ...state.timeSpent,
    },
  }

  const timeSpent = ev.at - state.phase.turnStartedAt
  newState.timeSpent[state.phase.turn] += timeSpent

  switch (ev.type) {
    case 'choice-made': {
      newState.choices[ev.team].push(ev.choice)

      const outcome = checkChoicesOutcome(newState)
      if (outcome) {
        newState.phase = {
          status: 'finished',
          outcome,
        }
        return newState
      }

      newState.phase = {
        status: 'ongoing',
        turn: opposite(state.phase.turn),
        turnStartedAt: ev.at,
      }

      return newState
    }
    case 'surrendered': {
      newState.phase = {
        status: 'finished',
        outcome: {
          finishReason: 'surrender',
          orderScore: ev.team === 'order' ? 0 : 1,
        },
      }

      return newState
    }
    case 'timed-out': {
      newState.timeSpent[ev.team] = state.timelimit

      newState.phase = {
        status: 'finished',
        outcome: {
          finishReason: 'timeout',
          orderScore: ev.team === 'order' ? 0 : 1,
        },
      }

      return newState
    }
    default: {
      throw new Error(`invalid event`)
    }
  }
}

export function checkChoicesOutcome(state: MatchState): Outcome | null {
  if (state.choices.order.length < 3) return null
  if (hasMagic3T(state.choices.order)) {
    return {
      finishReason: 'magic3t',
      orderScore: 1,
    }
  }

  if (state.choices.chaos.length < 3) return null
  if (hasMagic3T(state.choices.chaos)) {
    return {
      finishReason: 'magic3t',
      orderScore: 0,
    }
  }

  if (state.choices.chaos.length + state.choices.order.length === 9) {
    let orderScore = state.timeSpent.chaos / (state.timeSpent.chaos + state.timeSpent.order)
    if (Number.isNaN(orderScore)) orderScore = 0.5

    return {
      finishReason: 'draw',
      orderScore: orderScore,
    }
  }

  return null
}

function hasMagic3T(choices: Choice[]): boolean {
  for (let i = 0; i < choices.length; i++)
    for (let j = i + 1; j < choices.length; j++)
      for (let k = j + 1; k < choices.length; k++)
        if (choices[i] + choices[j] + choices[k] === 15) return true
  return false
}
