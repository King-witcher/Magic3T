import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { SentryExceptionCaptured } from '@sentry/nestjs'
import { DatabaseError } from '@/infra/database'
import { UnexpectedError } from '../errors'

@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
  logger = new Logger(UnexpectedErrorFilter.name, { timestamp: true })

  @SentryExceptionCaptured()
  catch(error: Error, argumentsHost: ArgumentsHost) {
    const context = argumentsHost.getType()

    if (error instanceof UnexpectedError) {
      this.logger.error(`UnexpectedError: ${error}`)
    } else if (error instanceof DatabaseError) {
      this.logger.error(
        `${error.name} ${error.code}: ${error.message}${error.sql ? ` on ${error.sql}` : ''}\n${error.stack}`
      )
    } else {
      this.logger.error(`Unknown error: ${error}`)
    }
    console.error(error)

    switch (context) {
      case 'ws': {
        const client = argumentsHost.switchToWs().getClient()
        client.emit('error', {
          errorCode: 'InternalServerError',
          description: 'An unexpected error occurred on the server.',
        })
        return
      }
      case 'http': {
        const ctx = argumentsHost.switchToHttp()
        const response = ctx.getResponse()
        response.status(500).json({
          errorCode: 'InternalServerError',
          description: 'An unexpected error occurred on the server.',
        })
        break
      }
      case 'rpc': {
      }
    }
  }
}
