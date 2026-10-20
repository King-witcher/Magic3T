import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { captureException, logger } from '@sentry/nestjs'
import { CacheableMemory } from 'cacheable'
import { REDIS, RedisClient } from '../redis'

export const BAN_DURATION = 6 * 60 * 60 * 1000 // 6 hours

export const STRIKE_THRESHOLD = 8
export const STRIKE_WINDOW = 10 * 60 * 1000 // 10 minutes

const MAX_TRACKED_IPS = 10_000

/** Paths are truncated so that huge URLs can't inflate memory usage. */
const MAX_PATH_LENGTH = 128

const BANLIST_KEY = 'banlist:ip'

@Injectable()
export class IpBlocklistService implements OnModuleInit {
  private readonly logger = new Logger(IpBlocklistService.name)

  constructor(@Inject(REDIS) private redis: RedisClient) {}

  private readonly bans = new CacheableMemory({
    ttl: BAN_DURATION,
    lruSize: MAX_TRACKED_IPS,
    useClone: false,
  })

  private readonly strikes = new CacheableMemory({
    ttl: STRIKE_WINDOW,
    lruSize: MAX_TRACKED_IPS,
    useClone: false,
  })

  async onModuleInit() {
    const bans = await this.redis.sMembers(BANLIST_KEY)
    for (const ip of bans) {
      this.bans.set(ip, true)
    }
    this.logger.log(`Restored ${bans.length} IP bans`)
  }

  isBanned(ip: string): boolean {
    return this.bans.has(ip)
  }

  ban(ip: string, reason: string) {
    if (!this.bans.has(ip)) {
      const message = `Banning IP ${ip} for ${BAN_DURATION / 60_000} minutes: ${reason}`
      this.logger.warn(message)
      logger.warn(message, { ip, reason })
    }

    this.bans.set(ip, true)
    this.persist(this.redis.sadd(BANLIST_KEY, ip))
    this.strikes.delete(ip)
  }

  unban(ip: string) {
    this.bans.set(ip, false)
    this.persist(this.redis.srem(BANLIST_KEY, ip))
    this.strikes.delete(ip)
  }

  strike(ip: string, path: string) {
    let paths = this.strikes.get<Set<string>>(ip)
    if (!paths) {
      paths = new Set()
      this.strikes.set(ip, paths)
    }

    paths.add(path.slice(0, MAX_PATH_LENGTH))
    if (paths.size >= STRIKE_THRESHOLD) {
      this.ban(ip, `requested ${paths.size} nonexistent routes`)
    }
  }

  private async persist(command: Promise<unknown>): Promise<void> {
    try {
      await command
    } catch (error) {
      this.logger.error('Failed to persist IP ban state on Redis', error)
      captureException(error)
    }
  }
}
