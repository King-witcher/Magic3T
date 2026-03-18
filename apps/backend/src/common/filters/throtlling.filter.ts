import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { respondError } from '../errors'

/**
 * Handles ThrottlerException and sends appropriate responses based on the context (HTTP, WebSocket, RPC).
 * @see ThrottlerException
 */
@Catch(ThrottlerException)
export class ThrottlingFilter implements ExceptionFilter {
  private logger: Logger = new Logger(ThrottlingFilter.name)

  catch(_: ThrottlerException, argumentsHost: ArgumentsHost) {
    const context = argumentsHost.getType()
    switch (context) {
      case 'ws': {
        const ctx = argumentsHost.switchToWs()
        const client = ctx.getClient()
        client.emit('error', respondError('TooManyRequests', 429))
        return
      }
      case 'http': {
        const ctx = argumentsHost.switchToHttp()
        const response = ctx.getResponse()
        response.status(429).json(respondError('TooManyRequests', 429))
        break
      }
      case 'rpc': {
        this.logger.error('RPC ThrottlerException: TooManyRequests')
      }
    }

    respondError('TooManyRequests', 429)
  }
}
