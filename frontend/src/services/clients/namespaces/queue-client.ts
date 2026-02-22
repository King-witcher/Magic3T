import { QueueMode } from '@/types/queue'
import { BaseApiClient } from '../base-api-client'

export class ApiQueueClient extends BaseApiClient<'queue'> {
  constructor() {
    super('queue')
  }

  /**
   * Enqueues the authenticated user in the specified queue mode.
   */
  async enqueue(queueMode: QueueMode): Promise<void> {
    await this.post('', { queueMode }, { authenticated: true })
  }

  /**
   * Dequeues the authenticated user from the queue.
   */
  async dequeue(): Promise<void> {
    await this.delete('', { authenticated: true })
  }
}
