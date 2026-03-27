import { MatchEventRow, MatchRow } from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { IDbClient, INSERT_INTO } from '@/shared/database'
import { DatabaseService } from '../database.service'

export type PersistMatchInput = {
  match: Omit<MatchRow, 'id' | 'uuid' | 'chaos_match_score' | 'total_time_spent' | 'date'>
  events: Omit<MatchEventRow, 'match_id'>[]
}

@Injectable()
export class MatchRepository {
  private readonly logger = new Logger(MatchRepository.name, { timestamp: true })

  constructor(private readonly databaseService: DatabaseService) {}

  async persist(input: PersistMatchInput, client?: IDbClient): Promise<void> {
    client ??= this.databaseService

    const insertMatch = INSERT_INTO<Partial<MatchRow>>('match', input.match).RETURNING`id`
    const [{ id: matchId }] = await client.query<{ id: number }>(insertMatch)

    if (input.events.length > 0) {
      const eventsWithMatchId = input.events.map((e) => ({ ...e, match_id: matchId }))
      const insertEvents = INSERT_INTO<MatchEventRow>('match_event', ...eventsWithMatchId)
      await client.query(insertEvents)
    }
  }
}
