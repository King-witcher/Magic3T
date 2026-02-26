import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Socket } from 'socket.io'

/**
 *
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: HttpException, argumentsHost: ArgumentsHost) {
    const context = argumentsHost.getType()

    switch (context) {
      case 'ws': {
        const client = argumentsHost.switchToWs().getClient<Socket>()
        client.emit('error', error.getResponse())
        return
      }
      case 'http': {
        const ctx = argumentsHost.switchToHttp()
        const response = ctx.getResponse()
        response.status(error.getStatus()).json(error.getResponse())
        break
      }
      case 'rpc': {
        console.error('RPC ResponseError:', error)
      }
    }
  }
}
