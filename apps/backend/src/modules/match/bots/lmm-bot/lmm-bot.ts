import { StateReportPayload } from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import { delay, unexpected } from '@/common'
import { BaseBot } from '@/modules/match/bots/base-bot'
import { Perspective } from '@/modules/match/lib'
import { createTree } from './lib'

function getMatchChoices(state: StateReportPayload, _team: Team) {
  const order = state[Team.Order].choices
  const chaos = state[Team.Chaos].choices
  const result: Choice[] = []
  for (let i = 0; i < chaos.length; i++) {
    result.push(order[i], chaos[i])
  }
  if (order.length > chaos.length) result.push(order[chaos.length])
  return result
}

export class LmmBot extends BaseBot {
  constructor(
    perspective: Perspective,
    private depth: number
  ) {
    super(perspective)
  }

  private async simulateThinkTime(state: StateReportPayload): Promise<void> {
    const choicesMade = state[Team.Order].choices.length + state[Team.Chaos].choices.length

    const baseDelays = [1000, 1500, 2500, 5000, 6000, 7000, 6000, 5000, 1000]
    const detphFactor = 3 / (1 + this.depth)
    const randomFactor = 1 + 0.3 * Math.random()
    const testingFactor = 1.0
    await delay(baseDelays[choicesMade] * randomFactor * detphFactor * testingFactor)
  }

  async think(state: StateReportPayload, team: Team): Promise<Choice> {
    await this.simulateThinkTime(state)

    const matchChoices = getMatchChoices(state, team)
    const tree = createTree(Math.min(this.depth, 9 - matchChoices.length), matchChoices)

    const values: {
      loses: Choice[]
      draws: Choice[]
      wins: Choice[]
    } = {
      loses: [],
      draws: [],
      wins: [],
    }

    const winNumber = team === Team.Order ? 1 : -1

    for (const branchId of Object.keys(tree.branches)) {
      if (!tree.branches[branchId]) continue
      if (tree.branches[branchId].value === winNumber) {
        values.wins.push(Number.parseInt(branchId, 10) as Choice)
      } else if (tree.branches[branchId].value === 0) {
        values.draws.push(Number.parseInt(branchId, 10) as Choice)
      } else {
        values.loses.push(Number.parseInt(branchId, 10) as Choice)
      }
    }

    if (values.wins.length) {
      return values.wins[Math.floor(Math.random() * values.wins.length)]
    }
    if (values.draws.length) {
      return values.draws[Math.floor(Math.random() * values.draws.length)]
    }
    if (values.loses.length) {
      return values.loses[Math.floor(Math.random() * values.loses.length)]
    }

    unexpected('LmmBot could not determine a valid choice to make.')
  }
}
