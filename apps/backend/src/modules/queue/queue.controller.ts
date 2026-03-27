import { BotId } from '@magic3t/common-types'
import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import z from 'zod'
import { ZodValidationPipe } from '@/common/pipes'
import { AuthGuard } from '@/modules/auth'
import { UserId } from '@/modules/auth/decorators'
import { QueueService } from './queue.service'

@Controller('queue')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class QueueController {
  // private readonly logger = new Logger(QueueController.name, {
  //   timestamp: true,
  // })

  constructor(private readonly queueService: QueueService) {}

  @ApiOperation({
    summary: 'Join queue for a ranked match',
  })
  @Post('/ranked/pvp')
  async enqueue(@UserId() userId: string) {
    return this.queueService.enqueue(userId, 'ranked')
  }

  @ApiOperation({
    summary: 'Join queue for a bot match',
  })
  @Post('/ranked/:botId')
  async enqueueBot(
    @UserId() userId: string,
    @Param(
      'botId',
      new ZodValidationPipe(z.enum([BotId.Elite, BotId.Legend, BotId.Recruit, BotId.Soldier]))
    )
    botId: BotId
  ) {
    return this.queueService.joinVsBot(userId, botId)
  }

  @ApiOperation({
    summary: 'Leave the queue for all modes',
  })
  @Delete('/')
  handleDequeue(@UserId() userId: string) {
    this.queueService.dequeue(userId, 'casual')
    this.queueService.dequeue(userId, 'ranked')
  }
}
