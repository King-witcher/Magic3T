import { Module } from '@nestjs/common'
import { HoneypotController } from './honeypot.controller'
import { IpBlocklistService } from './ip-blocklist.service'

@Module({
  controllers: [HoneypotController],
  providers: [IpBlocklistService],
  exports: [IpBlocklistService],
})
export class HoneypotModule {}
