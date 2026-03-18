import { Global, Module } from '@nestjs/common'
import { WebsocketCountingService } from './websocket-counting.service'
import { WebsocketEmitterService } from './websocket-emitter.service'

@Global()
@Module({
  providers: [WebsocketEmitterService, WebsocketCountingService],
  exports: [WebsocketEmitterService, WebsocketCountingService],
})
export class WebsocketModule {}
