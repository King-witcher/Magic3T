import { StateReportPayload } from '@magic3t/api-types'
import { Team } from '@magic3t/common-types'
import { delay, unexpected } from '@/common'
import { BaseBot } from '@/modules/match/bots/base-bot'

export class RandomBot extends BaseBot {
  async think(state: StateReportPayload) {
    const available = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).filter(
      (choice) =>
        !state[Team.Order].choices.includes(choice) && !state[Team.Chaos].choices.includes(choice)
    )

    await delay(Math.random() * 2000 + 3000) // Waits from 3 to 5 seconds before deciding

    if (!available.length) unexpected('RandomBot has no available choices to pick from.')

    const index = Math.trunc(Math.random() * available.length)

    return available[index]
  }
}
