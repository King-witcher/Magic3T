import { BotId } from '@magic3t/common-types'
import { BaseApiClient } from '../base-api-client'

export class ApiQueueClient extends BaseApiClient<'queue'> {
  constructor() {
    super('queue')
  }

  /**
   * Enqueues in the PvP ranked queue.
   */
  async enqueue(): Promise<void> {
    await this.post('ranked/pvp', { authenticated: true })
  }

  async joinBot(bot: BotId): Promise<void> {
    await this.post(`ranked/${bot}`, { authenticated: true })
  }

  async dequeue(): Promise<void> {
    await this.delete('')
  }
}
