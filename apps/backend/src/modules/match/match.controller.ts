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
import { respondError } from '@/common'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserId } from '@/modules/auth/decorators/user-id.decorator'
import { CurrentPerspective } from './decorators'
import { MatchStore, Perspective } from './lib'
import { MatchGuard } from './match.guard'
import { MatchService } from './match.service'
import { ListMatchesResultClass } from './swagger/list-matches'

@Controller('match')
export class MatchController {
  constructor(
    private matchBank: MatchStore,
    private matchService: MatchService
    // private matchRepository: MatchReposit
  ) {
    // const names = [BotName.Bot0, BotName.Bot1, BotName.Bot2, BotName.Bot3]
    // function shuffle() {
    //   let currentIndex = names.length
    //   while (currentIndex) {
    //     const randomIndex = Math.floor(Math.random() * currentIndex--)
    //     const temp = names[randomIndex]
    //     names[randomIndex] = names[currentIndex]
    //     names[currentIndex] = temp
    //   }
    // }
    // async function createRandomCvC() {
    //   shuffle()
    //   const [match1, match2] = await Promise.all([
    //     matchService.createCvCMatch(names[0], names[1]),
    //     matchService.createCvCMatch(names[2], names[3]),
    //   ])
    //   let terminated = 0
    //   return new Promise<void>((res) => {
    //     match1.on(MatchEventType.Finish, () => {
    //       if (++terminated === 2) res()
    //     })
    //     match2.on(MatchEventType.Finish, () => {
    //       if (++terminated === 2) res()
    //     })
    //   })
    // }
    // async function iter(count: number) {
    //   for (let i = 0; i < count; i++) {
    //     console.log(`iteration ${i + 1}`)
    //     await createRandomCvC()
    //   }
    // }
    // iter(20)
  }

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
  async getMatchById(@Param('uuid') uuid: string): Promise<Match.GetMatchResult> {
    // const row = await this.matchRepository.getById(matchId)
    // if (!row) respondError('match-not-found', 404, 'Match not found.')
    // return this.matchService.getMatchByRow(row)
    respondError('not-implemented', 501, 'This endpoint is not implemented yet.')
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
    @Param('uuid') uuid: string
  ): Promise<Match.ListMatchesResult> {
    const clampedLimit = clamp(limit, 0, 50)

    return {
      matches: [],
    }
  }
}
