import { Body, PipeTransform } from '@nestjs/common'
import z from 'zod'
import { respondError } from '../errors'
import { BODY_SCHEMA } from './body-schema.decorator'

/**
 * Lazy pipe: reads the Zod schema from @BodySchema metadata on the first request,
 * after all method decorators have been applied.
 */
class LazyBodySchemaPipe implements PipeTransform {
  private schema: z.ZodTypeAny | undefined = undefined

  constructor(
    private readonly target: object,
    private readonly propertyKey: string | symbol
  ) {}

  transform(value: unknown) {
    if (this.schema === undefined) {
      this.schema = Reflect.getMetadata(BODY_SCHEMA, this.target, this.propertyKey) ?? null
    }

    if (!this.schema) return value

    const result = this.schema.safeParse(value)
    if (!result.success) {
      respondError('ValidationError', 400, z.treeifyError(result.error))
    }
    return result.data
  }
}

/**
 * Parameter decorator that works together with @BodySchema.
 * Extracts and validates the request body using the Zod schema defined in @BodySchema,
 * throwing a 400 if validation fails.
 *
 * @example
 * @BodySchema({ schema: z.object({ token: z.string() }) })
 * async signIn(@ValidatedBody() body: { token: string }) {}
 */
export function ValidatedBody(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const pipe = new LazyBodySchemaPipe(target, propertyKey!)
    Body(pipe)(target, propertyKey, parameterIndex)
  }
}
