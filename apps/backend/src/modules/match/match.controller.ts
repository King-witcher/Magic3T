import { Match } from '@magic3t/api-types'
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { clamp } from 'lodash'
import z from 'zod'
import { respondError, ZodValidationPipe } from '@/common'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { CurrentPerspective } from './decorators'
import { MatchStore, Perspective } from './lib'
import { MatchGuard } from './match.guard'
import { MatchHistoryService } from './match-history.service'
import { ListMatchesResultClass } from './swagger/list-matches'

@Controller('match')
export class MatchController {
  constructor(
    private matchBank: MatchStore,
    private matchHistoryService: MatchHistoryService
  ) {}

  @Post(':matchId/forfeit')
  @ApiOperation({
    summary: 'Forfeit',
    description: 'Forfeit the current match',
  })
  @HttpCode(200)
  @UseGuards(MatchGuard)
  handleForfeit(@CurrentPerspective() matchAdapter: Perspective) {
    matchAdapter.surrender()
  }

  @ApiOperation({
    summary: 'Get state',
    description: 'Get the state of the current match',
  })
  @Get('state')
  getState() {
    return 1
  }

  @Get('current')
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
  @UseGuards(AuthGuard)
  handleActiveMatch(@UserId() userId: string) {
    const perspective = this.matchBank.getPerspective(userId)
    if (!perspective) return false
    return true
  }

  @Get(':uuid')
  @ApiOperation({
    summary: 'Get match by ID',
    description: 'Get a specific match by its ID',
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
    description: 'Get the most recent matches played by a user, sorted by date',
  })
  @ApiResponse({
    type: [ListMatchesResultClass],
  })
  async getMatchesByUser(
    @Query('limit', ParseIntPipe) limit: number,
    @Param('uuid', new ZodValidationPipe(z.uuid())) uuid: string
  ): Promise<Match.ListMatchesResult> {
    const clampedLimit = clamp(limit, 0, 50)

    return this.matchHistoryService.listMatchesByUserUuid(uuid, clampedLimit)
  }
}
