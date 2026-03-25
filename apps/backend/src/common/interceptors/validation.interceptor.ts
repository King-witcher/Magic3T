import { CallHandler, ExecutionContext, NestInterceptor, Paramtype } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import z from 'zod'
import { BODY_SCHEMA } from '../decorators/body-schema.decorator'
import { respondError } from '../errors'

export class ValidationInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const bodySchema = this.reflector.get<z.ZodType | undefined>(BODY_SCHEMA, context.getHandler())
    if (!bodySchema) return next.handle()

    const request = context.switchToHttp().getRequest()

    const result = bodySchema.safeParse(request.body)
    if (!result.success) {
      const issues = result.error.issues
      const metadata = Object.fromEntries(issues.map((issue) => [issue.path.join('.'), issue]))
      respondError('ValidationError', 400, metadata)
    }

    request.body = result.data
    return next.handle()
  }
}
