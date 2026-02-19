import { QueueClientEventsMap, QueueServerEvents, QueueServerEventsMap } from '@magic3t/api-types'
import { BotName } from '@magic3t/database-types'
import { UseGuards } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { BanGuard } from '@/common/guards'
import { BaseGateway } from '@/common/websocket/base.gateway'
import { WebsocketCountingService } from '@/infra/websocket/websocket-counting.service'
import { UserId } from '@/modules/auth/user-id.decorator'
import { CORS_ALLOWED_ORIGINS } from '@/shared/constants/cors'
import { GameModePipe } from './pipes/game-mode.pipe'
import { QueueService } from './queue.service'

@WebSocketGateway({ cors: { origin: CORS_ALLOWED_ORIGINS, credentials: true }, namespace: 'queue' })
@UseGuards(BanGuard)
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

  @SubscribeMessage('bot-0')
  async handleBot0(@UserId() uid: string) {
    await this.queueService.createBotMatch(uid, BotName.Bot0)
  }

  @SubscribeMessage('bot-1')
  async handleBot1(@UserId() uid: string) {
    await this.queueService.createBotMatch(uid, BotName.Bot1)
  }

  @SubscribeMessage('bot-2')
  async handleBot2(@UserId() uid: string) {
    await this.queueService.createBotMatch(uid, BotName.Bot2)
  }

  @SubscribeMessage('bot-3')
  async handleBot3(@UserId() uid: string) {
    await this.queueService.createBotMatch(uid, BotName.Bot3)
  }

  @SubscribeMessage('casual')
  handleCasual(@UserId() uid: string) {
    this.queueService.enqueue(uid, 'casual')
  }

  @SubscribeMessage('ranked')
  handleRanked(@UserId() uid: string) {
    this.queueService.enqueue(uid, 'ranked')
  }

  @SubscribeMessage('dequeue')
  handleDequeue(@UserId() userId: string, @MessageBody(GameModePipe) mode: 'ranked' | 'casual') {
    this.queueService.dequeue(userId, mode)
  }
}
