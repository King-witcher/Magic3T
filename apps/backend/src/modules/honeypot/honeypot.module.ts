import { Module } from '@nestjs/common'
import { HoneypotController } from './honeypot.controller'

@Module({
  controllers: [HoneypotController],
})
export class HoneypotModule {}
