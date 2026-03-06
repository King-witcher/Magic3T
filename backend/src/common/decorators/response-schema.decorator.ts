import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import z from 'zod'

export type ResponseSchemaOptions = {
  schema: z.ZodTypeAny
  description?: string
  status?: number
}

export function ResponseSchema(options: ResponseSchemaOptions): MethodDecorator {
  const bodySchema = options.schema?.toJSONSchema() as SchemaObject
  return applyDecorators(
    ApiResponse({
      description: options.description,
      schema: bodySchema,
      status: options.status,
    })
  )
}
