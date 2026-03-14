import { Choice, Division, League, Team } from '@magic3t/common-types'
import { MatchDocumentEventType } from '@magic3t/database-types'
import { ApiProperty } from '@nestjs/swagger'

export class MatchRowTeamClass {
  @ApiProperty({
    description: 'User ID',
    example: 'user123',
  })
  uid: string

  @ApiProperty({
    description: 'Player nickname',
    example: 'PlayerOne',
  })
  name: string

  @ApiProperty({
    description: 'Player league',
    enum: ['provisional', 'bronze', 'silver', 'gold', 'diamond', 'master', 'challenger'],
    example: 'gold',
  })
  league: League

  @ApiProperty({
    description: 'Division within the league',
    type: 'number',
    nullable: true,
    example: 3,
  })
  division: Division | null

  @ApiProperty({
    description: 'The player score in the match',
    example: 0.5,
  })
  score: number

  @ApiProperty({
    description: 'LP gained/lost in the match',
    example: 25,
  })
  lp_gain: number
}

export class MatchRowEventClass {
  @ApiProperty({
    description: 'Event type',
    enum: [0, 1, 2, 3],
    example: 0,
  })
  event: MatchDocumentEventType

  @ApiProperty({
    description: 'Team side',
    enum: [0, 1],
    example: 0,
  })
  side: Team

  @ApiProperty({
    description: 'Timestamp of the event',
    example: 1234567890,
  })
  time: number

  @ApiProperty({
    description: 'Choice made (1-9) - only for Choice events',
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    required: false,
    example: 5,
  })
  choice?: Choice

  @ApiProperty({
    description: 'Message text - only for Message events',
    type: 'string',
    required: false,
    example: 'Good game!',
  })
  message?: string
}

export class ListMatchesResultItemClass {
  @ApiProperty({
    description: 'Unique identifier of the match',
    example: '6oAAb1',
  })
  id: string

  @ApiProperty({
    description: 'Order team data',
    type: MatchRowTeamClass,
  })
  order: MatchRowTeamClass

  @ApiProperty({
    description: 'Chaos team data',
    type: MatchRowTeamClass,
  })
  chaos: MatchRowTeamClass

  @ApiProperty({
    description: 'Match events list',
    type: [MatchRowEventClass],
  })
  events: MatchRowEventClass[]

  @ApiProperty({
    description: 'Winning team (0 for Order, 1 for Chaos) or null if no winner yet',
    enum: [0, 1],
    nullable: true,
    example: 0,
  })
  winner: Team | null

  @ApiProperty({
    description: 'Match date and time',
    type: 'string',
    format: 'date-time',
    example: '2026-01-16T10:30:00Z',
  })
  date: Date
}

export class ListMatchesResultClass {
  @ApiProperty({
    description: 'List of matches',
    type: [ListMatchesResultItemClass],
  })
  matches: ListMatchesResultItemClass[]
}
