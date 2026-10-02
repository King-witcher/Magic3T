import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { Pool } from 'pg'
import { sql } from '@/shared/database'

@Injectable()
export class KeepAliveService {
  private readonly pools: Pool[]
  private readonly logger = new Logger(KeepAliveService.name, { timestamp: true })

  constructor() {
    const connectionStrings =
      process.env.KEEP_ALIVE_PG_CLUSTERS?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? []
    this.pools = connectionStrings.map((cs) => new Pool({ connectionString: cs }))
  }

  @Cron('0 0 * * *')
  keepAlive() {
    this.logger.debug(`Keeping alive PostgreSQL clusters`)
    Promise.all(this.pools.map((pool) => pool.query(sql`SELECT 1`))).catch((err) => {
      this.logger.error('Error keeping alive PostgreSQL clusters', err.message)
    })
  }
}
