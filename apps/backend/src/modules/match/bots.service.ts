import { BotId } from '@magic3t/common-types'
import { UserRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { unexpected } from '@/common'
import { UserRepository } from '@/infra/database/repositories'
import { MinMaxBot, RandomBot } from './bots'
import { BaseBot } from './bots/base-bot'
import { Perspective } from './lib'

const BOT_NICKNAMES = new Map([
  [BotId.Recruit, 'boteasy'],
  [BotId.Soldier, 'botmedium'],
  [BotId.Legend, 'bothard'],
  [BotId.Elite, 'botinvincible'],
])

@Injectable()
export class BotsService {
  constructor(private readonly userRepository: UserRepository) {}

  getBot(botId: BotId, perspective: Perspective): BaseBot {
    switch (botId) {
      case BotId.Recruit:
        return new RandomBot(perspective)
      case BotId.Soldier:
        return new MinMaxBot(perspective, 2)
      case BotId.Legend:
        return new MinMaxBot(perspective, 4)
      case BotId.Elite:
        return new MinMaxBot(perspective, 7)
      default:
        unexpected('Tried to get bot with invalid bot id', botId)
    }
  }

  async getUser(botId: BotId): Promise<UserRow> {
    const nickname = BOT_NICKNAMES.get(botId)
    if (!nickname) unexpected('Tried to get user with invalid bot id', botId)

    const user = await this.userRepository.getByNickname(nickname)
    if (!user) unexpected('Could not find user for bot', botId)
    return user
  }
}
