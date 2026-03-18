import { StateReportPayload } from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import { Channel } from '@/common/utils/channel'
import { MatchClassEventType } from '@/modules/match/lib/match'
import { Perspective } from '../lib/perspective'

export abstract class BaseBot {
  private channel: Channel<StateReportPayload> = new Channel<StateReportPayload>()
  private started = false

  constructor(private perspective: Perspective) {
    const callback = () => {
      const state = perspective.getStateReport()
      this.channel.send(state)
    }

    perspective.on(MatchClassEventType.Start, callback)
    perspective.on(MatchClassEventType.Choice, callback)
    perspective.on(MatchClassEventType.Finish, callback)
  }

  async start(): Promise<void> {
    if (this.started) {
      console.error('Bot already started')
      return
    }
    this.started = true

    while (true) {
      const state = await this.channel.receive()
      if (state.finished) break
      if (state.turn !== this.perspective.team) continue

      const choice = await this.think(state, this.perspective.team)
      this.perspective.pick(choice)
    }
  }

  protected abstract think(state: StateReportPayload, team: Team): Promise<Choice>
}
