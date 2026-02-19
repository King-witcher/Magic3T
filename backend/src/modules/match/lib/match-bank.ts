import { Team } from '@magic3t/common-types'
import { Injectable } from '@nestjs/common'
import { FirestoreService } from '@/infra/firestore'
import { Match, MatchClassEventType } from './match'
import { Perspective } from './perspective'

export type CreatePerspectivesParams = {
  match: Match
  orderId: string
  chaosId: string
}

@Injectable()
/// Maps all matches that are currently running on the server.
export class MatchBank {
  private perspectives: Map<string, Perspective> = new Map() // Maps user ids to matchAdapters
  private opponents: Map<string, string> = new Map()

  constructor(private databaseService: FirestoreService) {}

  /** Create a match, assign it an internal id, register it in the bank and return the match id. */
  createAndRegisterMatch(...params: ConstructorParameters<typeof Match>): {
    id: string
    match: Match
  } {
    // Get the match id as defined by the database service
    const id = this.databaseService.getTemporalId()

    // Create and assign the match in the bank
    const match = new Match(...params)
    match.id = id

    return {
      match,
      id,
    }
  }

  /// Creates instances of Perspective for two different user ids and stores this relation in the bank.
  createPerspectives({ match, orderId, chaosId }: CreatePerspectivesParams): {
    orderPerspective: Perspective
    chaosPerspective: Perspective
  } {
    const orderPerspective = new Perspective({
      match,
      team: Team.Order,
      teams: {
        order: orderId,
        chaos: chaosId,
      },
    })
    const chaosPerspective = new Perspective({
      match,
      team: Team.Chaos,
      teams: {
        order: orderId,
        chaos: chaosId,
      },
    })

    // Create relations in the bank
    this.perspectives.set(orderId, orderPerspective)
    this.perspectives.set(chaosId, chaosPerspective)
    this.opponents.set(orderId, chaosId)
    this.opponents.set(chaosId, orderId)

    // Remove from bank when match finishes
    match.on(MatchClassEventType.Finish, () => {
      this.perspectives.delete(orderId)
      this.perspectives.delete(chaosId)
      this.opponents.delete(orderId)
      this.opponents.delete(chaosId)
    })

    return { orderPerspective, chaosPerspective }
  }

  /** Returns the opponent user id for a given user id. */
  getOpponent(userId: string): string | null {
    const opponentUid = this.opponents.get(userId)
    return opponentUid ?? null
  }

  getPerspective(userId: string): Perspective | null {
    const perspective = this.perspectives.get(userId)
    return perspective || null
  }

  /// Gets if a user is currently in a match.
  containsUser(id: string): boolean {
    return this.perspectives.has(id)
  }
}
