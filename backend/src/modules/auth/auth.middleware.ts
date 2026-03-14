import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { AuthSessionService } from './auth-session.service'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  logger = new Logger(AuthMiddleware.name)
  constructor(private readonly authService: AuthSessionService) {}

  async use(req: Request, _: Response, next: NextFunction) {
    const sessionId = req.headers.authorization?.replace(/^Bearer /, '')
    if (!sessionId) return next()

    const session = await this.authService.getSession(sessionId)
    if (!session) this.logger.warn(`invalid or expired session token provided: ${sessionId}`)
    else req.session = session

    next()
  }
}
