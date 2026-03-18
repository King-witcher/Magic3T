import { HttpStatus, PipeTransform } from '@nestjs/common'
import { ErrorResponseException } from '@/common'

class InvalidGameModeError extends ErrorResponseException {
  constructor(value: unknown) {
    super(`invalid-game-mode`, HttpStatus.BAD_REQUEST, value)
  }
}

export class GameModePipe implements PipeTransform {
  transform(value: unknown): 'casual' | 'ranked' {
    if (typeof value !== 'string') {
      throw new InvalidGameModeError(value)
    }

    if (value !== 'casual' && value !== 'ranked') {
      throw new InvalidGameModeError(value)
    }

    return value
  }
}
