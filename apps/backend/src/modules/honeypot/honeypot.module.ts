import { Module } from '@nestjs/common'
import { HoneypotController } from './honeypot.controller'

@Module({
  controllers: [HoneypotController],
  providers: [],
  exports: [],
})
export class HoneypotModule {}
