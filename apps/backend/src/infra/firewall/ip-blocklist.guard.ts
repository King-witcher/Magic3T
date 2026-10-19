import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { HONEYPOT_KEY } from '../../modules/honeypot/honeypot.decorator'
import { getClientIp } from './client-ip'
import { IpBlocklistService } from './ip-blocklist.service'

@Injectable()
export class IpBlocklistGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly blocklist: IpBlocklistService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true

    const request = context.switchToHttp().getRequest<Request>()
    const ip = getClientIp(request)
    if (!ip) return true

    const isHoneypot = this.reflector.getAllAndOverride<boolean>(HONEYPOT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isHoneypot) {
      this.blocklist.ban(ip, `reached honeypot ${request.method} ${request.path}`)
      return true
    }

    if (this.blocklist.isBanned(ip)) {
      throw new NotFoundException(`Cannot ${request.method} ${request.originalUrl}`)
    }

    return true
  }
}
