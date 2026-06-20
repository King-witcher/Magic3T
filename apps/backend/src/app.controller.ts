import { CrashReportCommand, GetStatusResponse } from '@magic3t/api-types'
import { CrashReportRow } from '@magic3t/database-types'

import { Body, Controller, Get, Post, Redirect } from '@nestjs/common'
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { captureException, logger } from '@sentry/nestjs'
import * as z from 'zod'
import { BodySchema, respondError } from '@/common'
import { CrashReportsRepository } from '@/infra'
import { UserRepository } from './infra/database/repositories'

@Controller()
export class AppController {
  constructor(
    private readonly crashReportRepository: CrashReportsRepository,
    private userRepository: UserRepository
  ) {}

  @Get('/')
  @Redirect('/api')
  @ApiExcludeEndpoint()
  root() {}

  @ApiOperation({
    summary: 'Teapot endpoint',
    description: 'Fails with HTTP status code 418.',
  })
  @Get('teapot')
  async teapot() {
    await this.userRepository.createWithNickname('Test User')

    logger.debug('Teapot endpoint called', { endpoint: 'teapot' })
    respondError('Teapot', 418, 'I am a teapot')
  }

  @ApiOperation({
    summary: 'Trigger a test error',
    description: 'Captures a test exception in Sentry to verify error reporting is working.',
  })
  @Get('error')
  error() {
    const error = new Error('Test error for Sentry')
    error.name = 'TestError'
    captureException(error)
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
  @BodySchema({
    description: 'The crash details reported by the client.',
    schema: z.object({
      errorCode: z
        .string()
        .describe('Unique error code identifying the crash')
        .default('auth/unknown-error'),
      description: z.string().describe('Detailed description of the crash'),
      metadata: z.optional(z.unknown()).describe('Any extra context about the crash'),
    }),
  })
  @Throttle({ medium: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('crash-report')
  reportCrash(@Body() command: CrashReportCommand) {
    const row: CrashReportRow = {
      source: 'client',
      date: new Date(),
      error: {
        errorCode: command.errorCode,
        description: command.description,
      },
      metadata: command.metadata ?? null,
    }

    this.crashReportRepository.create(row)
  }
}
