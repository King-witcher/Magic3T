import { applyDecorators, SetMetadata } from '@nestjs/common'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import z from 'zod'

export const PARAMS_SCHEMA = Symbol('PARAMS_SCHEMA')

export type ParamsSchemaOptions = {
  schema: z.ZodTypeAny
  description?: string
}

/**
 * Method decorator that defines a Zod schema for validating the request parameters, and also adds the schema to the Swagger documentation using @ApiParam.
 *
 *
 * @example
 * @ParamsSchema({
 *   description: 'Request parameters containing the Firebase ID token.',
 *   schema: z.object({ token: z.string() }),
 * })
 * async signIn(@Body() body: { token: string }) {}
 */
export function ParamsSchema(options: ParamsSchemaOptions): MethodDecorator {
  const paramsSchema = options.schema?.toJSONSchema() as SchemaObject
  return applyDecorators(
    SetMetadata(PARAMS_SCHEMA, options.schema)
    // UsePipes(new ZodValidationPipe(options.schema))
  )
}
