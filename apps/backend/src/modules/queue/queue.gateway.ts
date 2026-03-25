import { QueueClientEventsMap, QueueServerEvents, QueueServerEventsMap } from '@magic3t/api-types'
import { Cron } from '@nestjs/schedule'
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { BaseGateway } from '@/common/websocket/base.gateway'
import { WebsocketCountingService } from '@/infra/websocket/websocket-counting.service'
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'
import { QueueService } from './queue.service'

@WebSocketGateway({ cors: { origin: CORS_ALLOWED_ORIGINS, credentials: true }, namespace: 'queue' })
export class QueueGateway extends BaseGateway<QueueClientEventsMap, QueueServerEventsMap, 'queue'> {
  constructor(
    private queueService: QueueService,
    private wsCountingService: WebsocketCountingService
  ) {
    super('queue')
  }

  @Cron('*/1 * * * * *')
  sendQueueStatus() {
    const queueCount = this.queueService.getUserCount()
    this.broadcast(QueueServerEvents.UserCount, {
      casual: {
        inGame: 0,
        queue: queueCount.casual,
      },
      connected: this.wsCountingService.countUsers('queue'),
      ranked: {
        inGame: 0,
        queue: queueCount.ranked,
      },
    })
  }

  @SubscribeMessage('interact')
  handleInteract() {
    return
  }
}
