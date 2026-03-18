import { randomBytes } from 'node:crypto'
import { League, Team } from '@magic3t/common-types'
import {
  MatchDocumentEvent,
  MatchDocumentEventType,
  MatchDocumentTeam,
  UserDocumentRole,
  UserRatingSnapshotRow,
  UserRowRole,
} from '@magic3t/database-types'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@/infra/config'
import { FirebaseAuthService } from '@/infra/firebase'
import { MatchDocumentRepository, UserDocumentRepository } from '@/infra/firestore'
import { RankConverter } from '@/modules'
import { INSERT_INTO } from '@/shared/database'
import { DatabaseService } from '../database.service'
import { UserRepository } from './user-repository'

const roleMap: Record<UserDocumentRole, UserRowRole> = {
  [UserDocumentRole.Player]: 'player',
  [UserDocumentRole.Creator]: 'superuser',
  [UserDocumentRole.Bot]: 'bot',
}

/** Generates a UUIDv7 encoding the given date's timestamp */
function uuidv7(date: Date): string {
  const msHex = date.getTime().toString(16).padStart(12, '0')
  const rand = randomBytes(10)
  rand[0] = 0x70 | (rand[0] & 0x0f) // version 7
  rand[2] = 0x80 | (rand[2] & 0x3f) // variant 10xx
  const r = rand.toString('hex')
  return `${msHex.slice(0, 8)}-${msHex.slice(8, 12)}-${r.slice(0, 4)}-${r.slice(4, 8)}-${r.slice(8, 20)}`
}

/** Base total LP for each league tier */
const LEAGUE_LP_BASE: Record<string, number> = {
  [League.Bronze]: 0,
  [League.Silver]: 400,
  [League.Gold]: 800,
  [League.Diamond]: 1200,
  [League.Master]: 1600,
  [League.Challenger]: 1600,
}

@Injectable()
export class MatchRepository {
  private readonly logger = new Logger(MatchRepository.name, { timestamp: true })

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly userRepository: UserRepository,
    private readonly userDocumentRepository: UserDocumentRepository,
    private readonly matchDocumentRepository: MatchDocumentRepository,
    private readonly firebaseAuthService: FirebaseAuthService
  ) {}

  /** Imports matches from Firestore and saves them with rating snapshots to PostgreSQL */
  async importFromFirebase() {
    const [userIdMap, firestoreMatches, rankConverter] = await Promise.all([
      this.userRepository.getIdMap(),
      this.matchDocumentRepository.getAll().then((matches) => {
        this.logger.log(`Fetched ${matches.length} matches from Firestore.`)
        return matches
      }),
      this.configService.ratingConfig.then((config) => new RankConverter(config)),
    ])

    /** Converts a team's league + division to an approximate ELO score */
    function teamToElo(team: MatchDocumentTeam): number {
      if (team.league === League.Provisional) return rankConverter.config.initial_elo
      const baseLp = LEAGUE_LP_BASE[team.league] ?? 0
      const divisionLp = team.division !== null ? (4 - team.division) * 100 : 0
      const { initial_elo, elo_per_league, initial_league_index } = rankConverter.config
      return ((baseLp + divisionLp) / 400 - initial_league_index) * elo_per_league + initial_elo
    }

    /** Computes time spent per team from match events, in seconds */
    function calcTimeSpent(events: MatchDocumentEvent[]): { order: number; chaos: number } {
      let orderMs = 0
      let chaosMs = 0
      let prevTime = 0
      for (const event of events) {
        if (event.event === MatchDocumentEventType.Message) continue
        const delta = event.time - prevTime
        if (event.side === Team.Order) orderMs += delta
        else chaosMs += delta
        prevTime = event.time
      }
      return { order: Math.round(orderMs / 1000), chaos: Math.round(chaosMs / 1000) }
    }

    type MatchEntry = {
      orderSnapshot: Omit<UserRatingSnapshotRow, 'id'>
      chaosSnapshot: Omit<UserRatingSnapshotRow, 'id'>
      matchRow: Record<string, unknown>
    }

    // Map Firestore matches to database entries, skipping matches with unknown users
    const entries = firestoreMatches.reduce<MatchEntry[]>((acc, match) => {
      const orderIds = userIdMap.get(match.data.order.uid)
      if (!orderIds) return acc
      const chaosIds = userIdMap.get(match.data.chaos.uid)
      if (!chaosIds) return acc

      const orderDelta = Math.round(rankConverter.relativeLpToElo(match.data.order.lp_gain))
      const chaosDelta = Math.round(rankConverter.relativeLpToElo(match.data.chaos.lp_gain))
      const timeSpent = calcTimeSpent(match.data.events)

      acc.push({
        orderSnapshot: {
          user_id: orderIds.id,
          score: teamToElo(match.data.order),
          apex_flag: match.data.order.league === League.Challenger ? 'challenger' : null,
          date: match.data.timestamp,
          hidden: match.data.order.league === League.Provisional,
        },
        chaosSnapshot: {
          user_id: chaosIds.id,
          score: teamToElo(match.data.chaos),
          apex_flag: match.data.chaos.league === League.Challenger ? 'challenger' : null,
          date: match.data.timestamp,
          hidden: match.data.chaos.league === League.Provisional,
        },
        matchRow: {
          uuid: uuidv7(match.data.timestamp),
          order_uuid: orderIds.uuid,
          order_nickname: match.data.order.name,
          order_match_score: match.data.order.score,
          order_delta: orderDelta,
          order_time_spent: timeSpent.order,
          chaos_uuid: chaosIds.uuid,
          chaos_nickname: match.data.chaos.name,
          chaos_delta: chaosDelta,
          chaos_time_spent: timeSpent.chaos,
          winner: match.data.winner,
        },
      })
      return acc
    }, [])

    // Persist all entries in a single transaction
    await this.databaseService.transaction(async (client) => {
      for (const { orderSnapshot, chaosSnapshot, matchRow } of entries) {
        const orderChain = INSERT_INTO('user_rating_snapshot', orderSnapshot).RETURNING`id`
        const [{ id: orderRatingId }] = await client.query<{ id: number }>({
          name: 'insert_user_rating_snapshot',
          text: orderChain.text,
          values: orderChain.values,
        })

        const chaosChain = INSERT_INTO('user_rating_snapshot', chaosSnapshot).RETURNING`id`
        const [{ id: chaosRatingId }] = await client.query<{ id: number }>({
          name: 'insert_user_rating_snapshot',
          text: chaosChain.text,
          values: chaosChain.values,
        })

        const matchChain = INSERT_INTO('match', {
          ...matchRow,
          order_rating_id: orderRatingId,
          chaos_old_rating: chaosRatingId,
        })
        await client.query({
          name: 'insert_match',
          text: matchChain.text,
          values: matchChain.values,
        })
      }
    })

    this.logger.log(`Successfully imported ${entries.length} matches from Firebase`)
  }
}
