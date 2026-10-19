import { Request } from 'express'

/** Gets the original client IP hidden by Render. */
export function getClientIp(request: Request): string | undefined {
  return request.header('True-Client-IP')
}
