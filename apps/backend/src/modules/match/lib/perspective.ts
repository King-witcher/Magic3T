import { AssignmentsPayload, StateReportPayload } from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import { Match, MatchClassEventsMap } from './match'

export type PerspectiveParams = {
  match: Match
  team: Team
  teams: {
    order: string
    chaos: string
  }
}

/**
 * A perspective is a portal through which a player (human or bot) can interact with its ongoing match.
 */
export class Perspective {
  private readonly match: Match
  public readonly team: Team
  private readonly teamIds: {
    order: string
    chaos: string
  }

  constructor({ match, team, teams }: PerspectiveParams) {
    this.match = match
    this.team = team
    this.teamIds = teams
  }

  async getAssignments(): Promise<AssignmentsPayload> {
    return {
      [Team.Order]: {
        profile: {
          id: this.teamIds.order,
        },
      },
      [Team.Chaos]: {
        profile: {
          id: this.teamIds.chaos,
        },
      },
    }
  }

  getStateReport(): StateReportPayload {
    return this.match.stateReport
  }

  pick(choice: Choice): void {
    this.match.handleChoice(this.team, choice)
  }

  surrender(): void {
    this.match.handleSurrender(this.team)
  }

  on<Event extends keyof MatchClassEventsMap>(
    event: Event,
    observer: (...data: Parameters<MatchClassEventsMap[Event]>) => void
  ) {
    this.match.on(event, observer)
  }
}
