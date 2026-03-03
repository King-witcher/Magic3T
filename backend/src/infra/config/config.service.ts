import { RatingConfigRow as RatingConfigDocument } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import { ConfigRepository } from '../firestore'

type CacheEntry = {
  value: Promise<unknown>
  expiresAt: number
}

@Injectable()
export class ConfigService {
  private cache = new Map<string, CacheEntry>()

  constructor(private configRepository: ConfigRepository) {
    setInterval(() => {
      const now = Date.now()
      for (const key in this.cache) {
        if (this.cache.get(key)!.expiresAt < now) {
          this.cache.delete(key)
        }
      }
    }, 30 * 1000)
  }

  private readCached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > now) {
      return cached.value as Promise<T>
    }

    const value = fn()
    this.cache.set(key, {
      value,
      expiresAt: now + ttl * 1000,
    })
    return value
  }

  get ratingConfig(): Promise<RatingConfigDocument> {
    return this.readCached('ratingConfig', 120, () => this.configRepository.getRatingConfig())
  }
}
