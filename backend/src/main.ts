import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { UnexpectedErrorFilter } from './common/filters/unexpected-error.filter'
import { ResponseErrorFilter } from './common/filters/response-error.filter'

const ALLOWED_ORIGINS = [
  'https://magic3t.com.br',
  'https://www.magic3t.com.br',
  'http://localhost:3000',
]
const PORT = process.env.PORT || 4000
const BACKEND_URL = process.env.MAGIC3T_BACKEND_URL

async function bootstrap() {
  const logger = new Logger('bootstrap function')

  const app = await NestFactory.create(AppModule)

  // Security middleware
  app.use(helmet())

  // Enable class validator globally
  app.useGlobalPipes(new ValidationPipe())

  // Global error filters
  app.useGlobalFilters(new UnexpectedErrorFilter(), new ResponseErrorFilter())

  // Enable CORS
  app.enableCors({
    origin: ALLOWED_ORIGINS,
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

  await app.listen(PORT)

  // Start self requests to keep the server awake
  keepServerAlive()

  logger.log(`Max concurrency: ${navigator.hardwareConcurrency}`)
  logger.log(`Swagger available on ${BACKEND_URL}/api`)
}

// TODO: Move to a cron job
function keepServerAlive() {
  const backend_url = process.env.MAGIC3T_BACKEND_URL
  if (!backend_url) {
    // eslint-disable-next-line quotes
    Logger.error("Backend url env var not found. Couldn't setup reup ticks.")
    return
  }

  const reup_rate = Number.parseInt(process.env.HEARTBEAT_RATE || '0', 10)
  if (!reup_rate) {
    Logger.warn('Heartbeat requests are disabled.')
    return
  }
  Logger.log('Heartbeat requests are enabled.')

  setInterval(() => {
    fetch(`${backend_url}/status`)
  }, reup_rate)
}

bootstrap()
