import { applyDecorators } from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import z from 'zod'

export const BODY_SCHEMA_METADATA_KEY = Symbol('body-schema')

export type BodySchemaOptions = {
  schema: z.ZodTypeAny
  description?: string
}

export function BodySchema(options: BodySchemaOptions): MethodDecorator {
  const bodySchema = options.schema?.toJSONSchema() as SchemaObject
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(BODY_SCHEMA_METADATA_KEY, options.schema, target, propertyKey)
    applyDecorators(
      ApiBody({
        description: options.description,
        schema: bodySchema,
      })
    )(target, propertyKey, descriptor)
  }
}
