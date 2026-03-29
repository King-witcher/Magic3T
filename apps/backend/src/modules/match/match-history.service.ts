import { Match as MatchNamespace } from '@magic3t/api-types'
import { League } from '@magic3t/common-types'
import { MatchEventRow, UserRatingSnapshotRow } from '@magic3t/database-types'
import { Injectable } from '@nestjs/common'
import {
  FullyJoinedMatchRow,
  MatchRepository,
  MatchRowWithRatings,
} from '@/infra/database/repositories/match-repository'
import { ConfigRepository } from '@/infra/firestore'
import { RankConverter } from '@/modules/rating'

type RatingSnapshot = Omit<UserRatingSnapshotRow, 'id' | 'user_id'> | null
type EventRow = Pick<MatchEventRow, 'type' | 'team' | 'time_ms' | 'choice'>

const PROVISIONAL_RANK: MatchNamespace.GetMatchResultTeam['rank'] = {
  league: League.Provisional,
  division: null,
  points: null,
  rankedCount: 0,
}

@Injectable()
export class MatchHistoryService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly configRepository: ConfigRepository
  ) {}

  async getMatchByUuid(uuid: string): Promise<MatchNamespace.GetMatchResult | null> {
    const [row, ratingConfig] = await Promise.all([
      this.matchRepository.getByUuid(uuid),
      this.configRepository.getRatingConfig(),
    ])

    if (!row) return null

    const converter = new RankConverter(ratingConfig)
    return this.toGetMatchResult(row, converter)
  }

  async listMatchesByUserUuid(
    uuid: string,
    limit: number
  ): Promise<MatchNamespace.ListMatchesResult> {
    const [rows, ratingConfig] = await Promise.all([
      this.matchRepository.getByUserUuid(uuid, limit),
      this.configRepository.getRatingConfig(),
    ])

    const converter = new RankConverter(ratingConfig)
    const matches = rows.map((row) => this.toListedMatch(row, converter))

    return { matches }
  }

  private buildTeamResult(
    rating: RatingSnapshot,
    delta: number | null,
    nickname: string,
    matchScore: number,
    uuid: string | null,
    converter: RankConverter
  ): MatchNamespace.GetMatchResultTeam {
    const rank = rating
      ? converter.getRankFromElo(rating.score, rating.hidden ? 0 : null, rating.apex_flag)
      : PROVISIONAL_RANK

    const lpGain = delta !== null ? converter.getLpGain(0, delta) : null

    return { lpGain, nickname, rank, score: matchScore, uuid: uuid ?? '' }
  }

  private toEventResult(row: EventRow): MatchNamespace.GetMatchResultEvent {
    if (row.type === 'forfeit' || row.type === 'timeout') {
      return { event: row.type, team: row.team, time: row.time_ms }
    }
    return { choice: row.choice!, event: 'choice', team: row.team, time: row.time_ms }
  }

  private toGetMatchResult(
    match: FullyJoinedMatchRow,
    converter: RankConverter
  ): MatchNamespace.GetMatchResult {
    return {
      uuid: match.uuid,
      events: match.events.map((e) => this.toEventResult(e)),
      date: match.date,
      winner: match.winner,
      order: this.buildTeamResult(
        match.order_rating,
        match.order_delta,
        match.order_nickname,
        match.order_match_score,
        match.order_id,
        converter
      ),
      chaos: this.buildTeamResult(
        match.chaos_rating,
        match.chaos_delta,
        match.chaos_nickname,
        match.chaos_match_score,
        match.chaos_id,
        converter
      ),
    }
  }

  private toListedMatch(
    match: MatchRowWithRatings,
    converter: RankConverter
  ): MatchNamespace.ListMatchesResultItem {
    return {
      uuid: match.uuid,
      date: match.date,
      winner: match.winner,
      order: this.buildTeamResult(
        match.order_rating,
        match.order_delta,
        match.order_nickname,
        match.order_match_score,
        match.order_id,
        converter
      ),
      chaos: this.buildTeamResult(
        match.chaos_rating,
        match.chaos_delta,
        match.chaos_nickname,
        match.chaos_match_score,
        match.chaos_id,
        converter
      ),
    }
  }
}
