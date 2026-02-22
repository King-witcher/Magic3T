import { Match as MatchNamespace, StateReportPayload } from '@magic3t/api-types'
import { Choice, Team } from '@magic3t/common-types'
import { MatchRowEvent, MatchRowEventType } from '@magic3t/database-types'
import { Observable, Stopwatch } from '@/common'
import { matchException } from '../types/match-error'
import { Player } from './player'

export const enum MatchClassEventType {
  Start = 0,
  Choice = 1,
  Surrender = 2,
  Timeout = 3,
  Finish = 4,
}

export type MatchClassSummary = {
  order: {
    timeSpent: number
  }
  chaos: {
    timeSpent: number
  }
  time: number
  winner: Team | null
  events: MatchRowEvent[]
}

export type MatchClassEventsMap = {
  [MatchClassEventType.Start](): void
  [MatchClassEventType.Choice](side: Team, choice: Choice, timestamp: number): void
  [MatchClassEventType.Surrender](side: Team, timestamp: number): void
  [MatchClassEventType.Timeout](side: Team, timestamp: number): void
  [MatchClassEventType.Finish](summary: MatchClassSummary): void
}

interface MatchClassParams {
  timelimit: number
}

/**
 * Represents a match between two players in a server agnostic manner.
 *
 * Handles the core game logic, state management, and event emission.
 */
export class Match extends Observable<MatchClassEventsMap> {
  private globalTime = new Stopwatch()
  public id: string
  public events: MatchRowEvent[] = []
  public turn: Team | null = null
  public winner: Team | null = null
  public finished = false
  public readonly [Team.Order]: Player
  public readonly [Team.Chaos]: Player
  public readonly timelimit: number

  constructor({ timelimit }: MatchClassParams) {
    super()
    this.timelimit = timelimit

    this[Team.Order] = new Player(timelimit, () => this.handleTimeout(Team.Order))
    this[Team.Chaos] = new Player(timelimit, () => this.handleTimeout(Team.Chaos))
  }

  public get time() {
    return this.globalTime.time
  }

  private get isDrawn() {
    return this[Team.Order].count + this[Team.Chaos].count === 9
  }

  public get stateReport(): StateReportPayload {
    const order = this[Team.Order]
    const chaos = this[Team.Chaos]

    const report: StateReportPayload = {
      [Team.Order]: {
        choices: [...order.choices],
        surrender: order.surrender,
        timeLeft: order.timer.remaining,
      },
      [Team.Chaos]: {
        choices: [...chaos.choices],
        surrender: chaos.surrender,
        timeLeft: chaos.timer.remaining,
      },
      turn: this.turn,
      pending: false,
      finished: this.finished,
    }

    return report
  }

  public getFinalScore(team: Team): number | null {
    if (!this.finished) return null
    if (this.winner !== null) return team === this.winner ? 1 : 0
    const playerTime = this.timelimit - this[team].timer.remaining
    const opponentTime = this.timelimit - this[1 - team].timer.remaining
    return playerTime / (playerTime + opponentTime)
  }

  public start() {
    if (this.turn !== null || this.finished) throw new Error('panic: called start() twice')

    this[Team.Order].timer.start()
    this.globalTime.start()
    this.turn = Team.Order
    this.emit(MatchClassEventType.Start)
  }

  private isAvailable(choice: Choice) {
    return !this[Team.Chaos].choices.includes(choice) && !this[Team.Order].choices.includes(choice)
  }

  /**
   * Checks if the specified team has a magic3t combination.
   * @param team The team to check for magic3t
   * @returns True if the team has a magic3t combination, false otherwise.
   */
  private hasMagic3T(team: Team): boolean {
    const player = this[team]

    const choices = player.choices
    for (let i = 0; i < choices.length; i++)
      for (let j = i + 1; j < choices.length; j++)
        for (let k = j + 1; k < choices.length; k++)
          if (choices[i] + choices[j] + choices[k] === 15) return true
    return false
  }

  public handleChoice(team: Team, choice: Choice): void {
    // TODO: Impvoe encapsulation of errors
    if (this.turn !== team) matchException(MatchNamespace.Error.WrongTurn)
    if (!this.isAvailable(choice)) matchException(MatchNamespace.Error.ChoiceUnavailable)

    this[Team.Order].timer.pause()
    this[Team.Chaos].timer.pause()

    const player = this[team]
    player.choices.push(choice)

    this.events.push({
      event: MatchRowEventType.Choice,
      choice,
      side: team,
      time: this.time,
    })

    this.turn = 1 - team
    this[1 - team].timer.start()

    if (this.hasMagic3T(team)) {
      this.finishMatch(team)
      this.emit(MatchClassEventType.Choice, team, choice, this.time)
      return
    }

    if (this.isDrawn) {
      this.finishMatch(null)
      this.emit(MatchClassEventType.Choice, team, choice, this.time)
      return
    }

    this.emit(MatchClassEventType.Choice, team, choice, this.time)
    return
  }

  public handleSurrender(side: Team): void {
    if (this.turn === null) matchException(MatchNamespace.Error.WrongTurn)

    const player = this[side]
    player.surrender = true

    this.events.push({
      event: MatchRowEventType.Forfeit,
      side,
      time: this.time,
    })

    this.finishMatch(1 - side)
    this.emit(MatchClassEventType.Surrender, side, this.time)

    return
  }

  private handleTimeout(side: Team) {
    const opposite = 1 - side

    this.events.push({
      event: MatchRowEventType.Timeout,
      side,
      time: this.time,
    })

    this.finishMatch(opposite)
    this.emit(MatchClassEventType.Timeout, side, this.time)
  }

  /**
   * Finishes the match, setting the turn to null, pausing timers, and emitting the finish event.
   */
  private finishMatch(winner: Team | null) {
    this.globalTime.pause()
    this[Team.Order].timer.pause()
    this[Team.Chaos].timer.pause()
    this.winner = winner
    this.finished = true
    this.turn = null

    this.emit(MatchClassEventType.Finish, {
      order: {
        timeSpent: this.timelimit - this[Team.Order].timer.remaining,
      },
      chaos: {
        timeSpent: this.timelimit - this[Team.Chaos].timer.remaining,
      },
      events: this.events,
      time: this.time,
      winner: this.winner,
    })
  }
}
