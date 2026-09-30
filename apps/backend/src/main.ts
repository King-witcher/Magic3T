// Enable instrumentation (Sentry, etc)
import './instrument'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { captureException, flush } from '@sentry/nestjs'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { MigrationRunnerService } from './infra/migrations/migration-runner.service'
import { CORS_ALLOWED_ORIGINS } from './shared/constants/cors'

const PORT = process.env.PORT || 4000
const BACKEND_URL = process.env.MAGIC3T_BACKEND_URL

async function bootstrap() {
  const logger = new Logger('bootstrap function')

  const app = await NestFactory.create(AppModule)

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        },
      },
    })
  )

  // Enable CORS
  app.enableCors({
    origin: CORS_ALLOWED_ORIGINS,
    credentials: true,
  })

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Magic3T API')
    .addBearerAuth()
    .setDescription('Api used by the Magic3T frontend to interact with the game server')
    .setVersion('2.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)

  // Setup API scalar api reference
  app.use(
    '/api',
    apiReference({
      content: document,
    })
  )

  try {
    await app.get(MigrationRunnerService).run()
  } catch (error) {
    captureException(error)
    logger.error('Runtime migrations failed. Aborting startup.', error)
    await flush(2000)
    process.exit(1)
  }

  await app.listen(PORT)

  logger.log(`Max concurrency: ${navigator.hardwareConcurrency}`)
  logger.log(`Swagger available on ${BACKEND_URL}/api`)
}

bootstrap()
