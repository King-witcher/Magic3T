import { Module } from '@nestjs/common'
import { IpBlocklistService } from './ip-blocklist.service'

@Module({
  providers: [IpBlocklistService],
  exports: [IpBlocklistService],
})
export class FirewallModule {}
