import { CrashReportCommand, GetStatusResponse } from '@magic3t/api-types'
import { CrashReportRow } from '@magic3t/database-types'

import { Body, Controller, Get, Post, Redirect } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { captureException, logger } from '@sentry/nestjs'
import * as z from 'zod'
import { BodySchema, respondError } from '@/common'
import { CrashReportsRepository } from '@/infra'

@Controller()
export class AppController {
  constructor(private readonly crashReportRepository: CrashReportsRepository) {}

  @Get('/')
  @Redirect('/api')
  @ApiExcludeEndpoint()
  root() {}

  @Get('favicon.ico')
  @ApiExcludeEndpoint()
  favicon() {
    respondError('No favicon', 404)
  }

  @ApiOperation({
    summary: 'Teapot endpoint',
    description: 'Fails with HTTP status code 418.',
  })
  @Get('teapot')
  async teapot() {
    logger.debug('Teapot endpoint called', { endpoint: 'teapot' })
    respondError('Teapot', 418, 'I am a teapot')
  }

  @ApiOperation({
    summary: 'Service status',
    description: 'Returns the service status for tracking downtimes.',
  })
  @Get('status')
  status(): GetStatusResponse {
    return {
      status: 'available',
      timestamp: new Date().toISOString(),
    }
  }

  @ApiOperation({
    summary: 'Report a crash',
    description: 'Endpoint to report crashes from the client.',
  })
  @Throttle({ medium: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('crash-report')
  reportCrash() {}
}
