import { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import z from 'zod'
import { respondError } from '../errors'

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value)
      return parsedValue
    } catch (error) {
      const issues = (<z.ZodError>error).issues
      const response = Object.fromEntries(issues.map((issue) => [issue.path.join('.'), issue]))
      respondError('ValidationError', 400, response)
    }
  }
}
