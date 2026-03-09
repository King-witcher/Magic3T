import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { SessionData } from '@/shared/types/session-data'

@Injectable()
export class AuthService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getSession(token: string): Promise<SessionData | null> {
    const session = await this.cacheManager.get<SessionData>(`session:${token}`)
    return session ?? null
  }
}
