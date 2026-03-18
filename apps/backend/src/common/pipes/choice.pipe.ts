import { Choice } from '@magic3t/common-types'
import { HttpStatus, PipeTransform } from '@nestjs/common'
import { respondError } from '../errors'

export class ChoicePipe implements PipeTransform {
  transform(value: unknown): Choice {
    if (typeof value === 'string') {
      const value_ = Number.parseInt(value, 10)
      if (!this.isChoice(value_))
        respondError('invalid-choice', HttpStatus.BAD_REQUEST, 'Invalid choice')
      return value_
    }

    if (!this.isChoice(value))
      respondError('invalid-choice', HttpStatus.BAD_REQUEST, 'Invalid choice')
    return value
  }

  isChoice(value: unknown): value is Choice {
    if (typeof value === 'number' && value % 1 === 0 && 0 < value && value < 10) return true
    return false
  }
}
