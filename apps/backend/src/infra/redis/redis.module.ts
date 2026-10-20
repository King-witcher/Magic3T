import { Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common'
import { createClient } from 'redis'

export const REDIS = Symbol('REDIS')
export type RedisClient = ReturnType<typeof createClient>

@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: async () => {
        const logger = new Logger(RedisModule.name)
        const client = createClient({ url: process.env.VALKEY_HOST })
        client.on('error', (error) => logger.error(error))
        await client.connect()
        return client
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: RedisClient) {}

  async onApplicationShutdown() {
    await this.redis.close()
  }
}
