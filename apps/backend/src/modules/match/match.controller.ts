import { Match } from '@magic3t/api-types'
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { clamp } from 'lodash'
import z from 'zod'
import { ResponseSchema, respondError, ZodValidationPipe } from '@/common'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { CurrentPerspective } from './decorators'
import { MatchStore, Perspective } from './lib'
import { MatchGuard } from './match.guard'
import { MatchHistoryService } from './match-history.service'
import { GET_MATCH_SCHEMA, LIST_MATCHES_SCHEMA } from './swagger/match-schemas'

@Controller('match')
export class MatchController {
  constructor(
    private matchBank: MatchStore,
    private matchHistoryService: MatchHistoryService
  ) {}

  @Post(':matchId/forfeit')
  @ApiOperation({
    summary: 'Forfeit',
    description:
      'Forfeits (surrenders) the match the authenticated user is currently playing. The user is identified by their session, so the path parameter is ignored. Fails if the user is not in an active match.',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(MatchGuard)
  handleForfeit(@CurrentPerspective() matchAdapter: Perspective) {
    matchAdapter.surrender()
  }

  @ApiOperation({
    summary: 'Get state',
    description: 'Gets the state of the current match. Not implemented yet.',
  })
  @Get('state')
  getState() {
    return 1
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current match',
    description:
      'Returns the identifier of the match the authenticated user is currently playing. Responds with 404 if the user has no active match.',
  })
  @ApiBearerAuth()
  @ResponseSchema({
    description: 'The user has no active match.',
    schema: z.object({
      errorCode: z.literal('no-active-match'),
      metadata: z.string(),
    }),
    status: HttpStatus.NOT_FOUND,
  })
  @UseGuards(AuthGuard)
  handleCurrentMatch(@UserId() userId: string) {
    const perspective = this.matchBank.getPerspective(userId)
    // TODO: shouldn't return 404
    if (!perspective) respondError('no-active-match', 404, 'The user has no active match.')
    return {
      id: '',
    }
  }

  @Get('me/am-active')
  @ApiOperation({
    summary: 'Check for an active match',
    description: 'Returns whether the authenticated user is currently playing a match.',
  })
  @ApiBearerAuth()
  @ResponseSchema({
    description: 'True if the user is in an active match, false otherwise.',
    schema: z.boolean().describe('Whether the user is currently in an active match'),
  })
  @UseGuards(AuthGuard)
  handleActiveMatch(@UserId() userId: string) {
    const perspective = this.matchBank.getPerspective(userId)
    if (!perspective) return false
    return true
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Get match by ID',
    description: 'Returns the full detail of a single match, including every event, by its UUID.',
  })
  @ApiParam({ name: 'uuid', description: 'The UUID of the match to fetch', format: 'uuid' })
  @ResponseSchema({
    description: 'The full match detail.',
    schema: GET_MATCH_SCHEMA,
  })
  @ResponseSchema({
    description: 'No match exists with the given UUID.',
    schema: z.object({
      errorCode: z.literal('match-not-found'),
      metadata: z.string(),
    }),
    status: HttpStatus.NOT_FOUND,
  })
  async getMatchById(
    @Param('uuid', new ZodValidationPipe(z.uuid())) uuid: string
  ): Promise<Match.GetMatchResult> {
    const result = await this.matchHistoryService.getMatchByUuid(uuid)
    if (!result) respondError('match-not-found', 404, 'Match not found.')
    return result
  }

  @Get('user/:uuid')
  @ApiOperation({
    summary: 'Get recent matches',
    description:
      'Returns the most recent matches played by a user, sorted by date (most recent first).',
  })
  @ApiParam({
    name: 'uuid',
    description: 'The UUID of the user whose matches to list',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of matches to return. Clamped to the range 0-50.',
    required: true,
    schema: { type: 'integer', minimum: 0, maximum: 50 },
  })
  @ResponseSchema({
    description: "A page of the user's recent matches.",
    schema: LIST_MATCHES_SCHEMA,
  })
  async getMatchesByUser(
    @Query('limit', ParseIntPipe) limit: number,
    @Param('uuid', new ZodValidationPipe(z.uuid())) uuid: string
  ): Promise<Match.ListMatchesResult> {
    const clampedLimit = clamp(limit, 0, 50)

    return this.matchHistoryService.listMatchesByUserUuid(uuid, clampedLimit)
  }
}
