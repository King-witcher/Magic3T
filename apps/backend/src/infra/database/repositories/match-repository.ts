import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MatchRepository {
  private readonly logger = new Logger(MatchRepository.name, { timestamp: true })
}
