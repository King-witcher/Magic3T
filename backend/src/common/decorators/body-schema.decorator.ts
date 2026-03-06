import { ApiBody } from '@nestjs/swagger'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import z from 'zod'

export const BODY_SCHEMA = Symbol('BODY_SCHEMA')

export type BodySchemaOptions = {
  schema: z.ZodTypeAny
  description?: string
}

/**
 * Method decorator that defines a Zod schema for validating the request body, and also adds the schema to the Swagger documentation using @ApiBody.
 *
 * The actual validation is performed by the @ValidatedBody parameter decorator, which reads the schema from metadata.
 *
 * @example
 * @BodySchema({
 *   description: 'Request body containing the Firebase ID token.',
 *   schema: z.object({ token: z.string() }),
 * })
 * async signIn(@ValidatedBody() body: { token: string }) {}
 */
export function BodySchema(options: BodySchemaOptions): MethodDecorator {
  const bodySchema = options.schema?.toJSONSchema() as SchemaObject
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(BODY_SCHEMA, options.schema, target, propertyKey)
    ApiBody({
      description: options.description,
      schema: bodySchema,
    })(target, propertyKey, descriptor)
  }
}
