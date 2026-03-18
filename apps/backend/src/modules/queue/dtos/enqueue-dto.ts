import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsEnum } from 'class-validator'

export enum QueueMode {
  Bot0 = 'bot-0',
  Bot1 = 'bot-1',
  Bot2 = 'bot-2',
  Bot3 = 'bot-3',
  Casual = 'casual',
  Ranked = 'ranked',
}

export enum BotDifficulty {
  Random = 0,
  Medium = 1,
  Hard = 2,
  Invincible = 3,
}

export class EnqueueDto {
  @ApiProperty({
    enum: QueueMode,
  })
  @IsDefined()
  @IsEnum(QueueMode)
  queueMode: QueueMode
}
