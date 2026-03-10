import { applyDecorators, UsePipes } from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import z from 'zod'
import { ZodValidationPipe } from '../pipes'

export const BODY_SCHEMA = Symbol('BODY_SCHEMA')

export type BodySchemaOptions = {
  schema: z.ZodTypeAny
  description?: string
}

/**
 * Method decorator that defines a Zod schema for validating the request body, and also adds the schema to the Swagger documentation using @ApiBody.
 *
 *
 * @example
 * @BodySchema({
 *   description: 'Request body containing the Firebase ID token.',
 *   schema: z.object({ token: z.string() }),
 * })
 * async signIn(@Body() body: { token: string }) {}
 */
export function BodySchema(options: BodySchemaOptions): MethodDecorator {
  const bodySchema = options.schema?.toJSONSchema() as SchemaObject
  return applyDecorators(
    ApiBody({
      description: options.description,
      schema: bodySchema,
    }),
    UsePipes(new ZodValidationPipe(options.schema))
  )
}
