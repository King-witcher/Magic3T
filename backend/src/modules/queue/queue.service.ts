import { QueueServerEvents } from '@magic3t/api-types'
import { BotName } from '@magic3t/database-types'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { respondError } from '@/common'
import { WebsocketEmitterService } from '@/infra/websocket/websocket-emitter.service'
import { MatchService } from '@/modules/match'

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name, { timestamp: true })
  casualPendingUid: string | null = null
  rankedPendingUid: string | null = null

  constructor(
    private matchService: MatchService,
    private websocketEmitterService: WebsocketEmitterService
  ) {}

  private async enqueueInternal(userId: string, mode: 'casual' | 'ranked') {
    if (!this.matchService.isAvailable(userId)) {
      this.logger.error(`player "${userId}" unavailable for queue: in game`)
      respondError(
        'already-in-game',
        HttpStatus.CONFLICT,
        'You are already in a match and cannot queue until the match ends'
      )
    }

    if (mode === 'casual') {
      respondError('not-implemented', 501, 'Casual mode is not implemented yet')
    }
    if (mode === 'ranked') {
      if (!this.rankedPendingUid) {
        this.rankedPendingUid = userId
        this.logger.log(`userId ${userId} joined ranked queue`)
      } else if (this.rankedPendingUid !== userId) {
        const pendingUserId = this.rankedPendingUid
        this.logger.log(`found a ranked match between ${pendingUserId} and ${userId}`)

        this.dequeue(pendingUserId)
        const matchId = await this.matchService.createPvPMatch(pendingUserId, userId)

        this.websocketEmitterService.send(pendingUserId, 'queue', QueueServerEvents.MatchFound, {
          matchId,
          opponentId: userId,
        })
        this.websocketEmitterService.send(userId, 'queue', QueueServerEvents.MatchFound, {
          matchId,
          opponentId: pendingUserId,
        })
      }
    }
  }

  /** Adds a user to the queue in the specified mode. */
  enqueue(userId: string, mode: 'casual' | 'ranked') {
    this.enqueueInternal(userId, mode)
    const userQueueModes = this.getQueueModes(userId)
    this.websocketEmitterService.send(userId, 'queue', QueueServerEvents.QueueAccepted, {
      mode,
    })
    this.websocketEmitterService.send(userId, 'queue', QueueServerEvents.QueueModes, userQueueModes)
  }

  /** Gets the queue modes a user is currently in. */
  getQueueModes(uid: string) {
    return {
      casual: this.casualPendingUid === uid,
      ranked: this.rankedPendingUid === uid,
    }
  }

  /** Determines if a user is already in the queue. */
  isInQueue(uuid: string) {
    return this.casualPendingUid === uuid || this.rankedPendingUid === uuid
  }

  /** Dequeues a user from a game mode. If no mode is specified, removes from both */
  dequeue(uuid: string, mode?: 'casual' | 'ranked') {
    if ((mode || 'casual') === 'casual' && this.casualPendingUid === uuid) {
      this.casualPendingUid = null
      this.logger.log(`userId ${uuid} left casual queue`)
    }

    if ((mode || 'ranked') === 'ranked' && this.rankedPendingUid === uuid) {
      this.rankedPendingUid = null
      this.logger.log(`userId ${uuid} left ranked queue`)
    }

    const userQueueModes = this.getQueueModes(uuid)
    this.websocketEmitterService.send(uuid, 'queue', QueueServerEvents.QueueModes, userQueueModes)
  }

  /** Gets the count of users currently in each queue mode. */
  getUserCount() {
    return {
      casual: this.casualPendingUid ? 1 : 0,
      ranked: this.rankedPendingUid ? 1 : 0,
    }
  }

  /** Creates a match between a user and a specified bot. */
  async createBotMatch(userId: string, botName: BotName) {
    // Create a match
    const matchId = await this.matchService.createPlayerVsBot(userId, botName)

    // Notify the user
    this.websocketEmitterService.send(userId, 'queue', QueueServerEvents.MatchFound, {
      matchId,
      opponentId: '', // FIXME: bot id
    })
  }
}
