import { Match as MatchNamespace } from '@magic3t/api-types'
import { ClientRank, Division, League } from '@magic3t/common-types'
import { MatchEventRow, UserRatingSnapshotRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import {
  FullyJoinedMatchRow,
  MatchRepository,
  MatchRowWithRatings,
} from '@/infra/database/repositories/match-repository'

type RatingSnapshot = Omit<UserRatingSnapshotRow, 'id' | 'user_id'> | null
type EventRow = Pick<MatchEventRow, 'type' | 'team' | 'time_ms' | 'choice'>

const PROVISIONAL_RANK: ClientRank = {
  league: null,
  division: null,
  lp: null,
}

@Injectable()
export class MatchHistoryService {
  constructor(private readonly matchRepository: MatchRepository) {}

  async getMatchByUuid(uuid: string): Promise<MatchNamespace.GetMatchResult | null> {
    const row = await this.matchRepository.getByUuid(uuid)
    if (!row) return null
    return this.toGetMatchResult(row)
  }

  async listMatchesByUserUuid(
    uuid: string,
    limit: number
  ): Promise<MatchNamespace.ListMatchesResult> {
    const rows = await this.matchRepository.getByUserUuid(uuid, limit)
    const matches = rows.map((row) => this.toListedMatch(row))
    return { matches }
  }

  private buildTeamResult(
    rating: RatingSnapshot,
    lpGain: number | null,
    nickname: string,
    matchScore: number,
    uuid: string | null
  ): MatchNamespace.GetMatchResultTeam {
    const rank: ClientRank = rating
      ? {
          league: rating.league as League | null,
          division: rating.division as Division | null,
          lp: rating.lp,
        }
      : PROVISIONAL_RANK

    return { lpGain, nickname, rank, score: matchScore, uuid: uuid ?? '' }
  }

  private toEventResult(row: EventRow): MatchNamespace.GetMatchResultEvent {
    if (row.type === 'forfeit' || row.type === 'timeout') {
      return { event: row.type, team: row.team, time: row.time_ms }
    }
    return { choice: row.choice!, event: 'choice', team: row.team, time: row.time_ms }
  }

  private toGetMatchResult(match: FullyJoinedMatchRow): MatchNamespace.GetMatchResult {
    return {
      uuid: match.uuid,
      events: match.events.map((e) => this.toEventResult(e)),
      date: match.date,
      winner: match.winner,
      order: this.buildTeamResult(
        match.order_rating,
        match.order_lp_gain,
        match.order_nickname,
        match.order_match_score,
        match.order_id
      ),
      chaos: this.buildTeamResult(
        match.chaos_rating,
        match.chaos_lp_gain,
        match.chaos_nickname,
        match.chaos_match_score,
        match.chaos_id
      ),
    }
  }

  private toListedMatch(match: MatchRowWithRatings): MatchNamespace.ListMatchesResultItem {
    return {
      uuid: match.uuid,
      date: match.date,
      winner: match.winner,
      order: this.buildTeamResult(
        match.order_rating,
        match.order_lp_gain,
        match.order_nickname,
        match.order_match_score,
        match.order_id
      ),
      chaos: this.buildTeamResult(
        match.chaos_rating,
        match.chaos_lp_gain,
        match.chaos_nickname,
        match.chaos_match_score,
        match.chaos_id
      ),
    }
  }
}
