import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { ErrorResponseException } from '../errors'

/**
 * Handles ErrorResponseException and sends appropriate responses based on the context (HTTP, WebSocket, RPC).
 * @see ErrorResponseException
 */
@Catch(ErrorResponseException)
export class ResponseErrorFilter implements ExceptionFilter {
  catch(error: ErrorResponseException, argumentsHost: ArgumentsHost) {
    // captureException(error)
    const context = argumentsHost.getType()
    switch (context) {
      case 'ws': {
        const client = argumentsHost.switchToWs().getClient()
        client.emit('error', error.response)
        return
      }
      case 'http': {
        const ctx = argumentsHost.switchToHttp()
        const response = ctx.getResponse()
        response.status(error.httpStatus).json(error.response)
        break
      }
      case 'rpc': {
        console.error('RPC ResponseError:', error)
      }
    }
  }
}
