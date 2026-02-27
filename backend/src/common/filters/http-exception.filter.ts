import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { Request, Response } from 'express'
import { Socket } from 'socket.io'
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: Logger = new Logger(HttpExceptionFilter.name)

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
        const status = error.getStatus()
        const response = ctx.getResponse<Response>()
        response.status(status).json(error.getResponse())

        if (status === 404) {
          const request = ctx.getRequest<Request>()
          const message = `Suspicious request from IP ${request.header('True-Client-IP')}: ${request.method} ${request.url}`
          this.logger.warn(message)
          Sentry.logger.warn(message)
        }

        break
      }
      case 'rpc': {
        console.error('RPC ResponseError:', error)
      }
    }
  }
}
