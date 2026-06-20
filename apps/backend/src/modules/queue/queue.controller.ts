import { BotId } from '@magic3t/common-types'
import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger'
import z from 'zod'
import { ZodValidationPipe } from '@/common/pipes'
import { AuthGuard } from '@/modules/auth'
import { UserId } from '@/modules/auth/decorators'
import { QueueService } from './queue.service'

/** Bot difficulties a player can queue against. */
const BOT_IDS = ['elite', 'legend', 'recruit', 'soldier'] as const

@Controller('queue')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class QueueController {
  // private readonly logger = new Logger(QueueController.name, {
  //   timestamp: true,
  // })

  constructor(private readonly queueService: QueueService) {}

  @ApiOperation({
    summary: 'Join the ranked PvP queue',
    description:
      'Adds the authenticated user to the ranked player-vs-player queue. When an opponent is found, both players receive a `matchFound` event over the `queue` websocket channel; this endpoint itself returns no match data. Fails if the user is already in a match.',
  })
  @Post('/ranked/pvp')
  async enqueue(@UserId() userId: string) {
    return this.queueService.enqueue(userId, 'ranked')
  }

  @ApiOperation({
    summary: 'Start a match against a bot',
    description:
      'Immediately creates a ranked match between the authenticated user and the chosen bot. The match id is delivered through a `matchFound` event on the `queue` websocket channel.',
  })
  @ApiParam({
    name: 'botId',
    description: 'The difficulty of the bot to play against.',
    enum: BOT_IDS,
  })
  @Post('/ranked/:botId')
  async enqueueBot(
    @UserId() userId: string,
    @Param('botId', new ZodValidationPipe(z.enum(BOT_IDS)))
    botId: BotId
  ) {
    return this.queueService.joinVsBot(userId, botId)
  }

  @ApiOperation({
    summary: 'Leave the queue',
    description:
      'Removes the authenticated user from every queue (casual and ranked). The updated queue state is pushed over the `queue` websocket channel.',
  })
  @Delete('/')
  handleDequeue(@UserId() userId: string) {
    this.queueService.dequeue(userId, 'casual')
    this.queueService.dequeue(userId, 'ranked')
  }
}
