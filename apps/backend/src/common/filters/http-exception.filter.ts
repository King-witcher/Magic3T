import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import { getClientIp, IpBlocklistService } from '@/modules/honeypot'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger: Logger = new Logger(HttpExceptionFilter.name)

  constructor(private readonly blocklist: IpBlocklistService) {}

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

        if (status === 404) this.handleNotFound(ctx.getRequest<Request>())

        break
      }
      case 'rpc': {
        console.error('RPC ResponseError:', error)
      }
    }
  }

  private handleNotFound(request: Request) {
    const ip = getClientIp(request)

    if (ip && this.blocklist.isBanned(ip)) return

    const message = `Suspicious request from IP ${ip}: ${request.method} ${request.url}`
    this.logger.warn(message)
    Sentry.logger.warn(message)

    if (ip && !request.route) this.blocklist.strike(ip, request.path)
  }
}
