import { AuthNamespace } from '@magic3t/api-types'
import { Controller, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import z from 'zod'
import { respondError, ValidatedBody } from '@/common'
import { BodySchema } from '@/common/decorators/body-schema.decorator'
import { ResponseSchema } from '@/common/decorators/response-schema.decorator'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Signs in a user using a Firebase token.
   */
  @Post('signin/firebase')
  // @EndpointDoc({
  //   summary: 'Sign in with Firebase',
  //   requestBodySchema: z.object({
  //     token: z.string().describe('Firebase ID token obtained from the client'),
  //   }),
  // })

  @ApiOperation({
    summary: 'Sign in with Firebase',
  })
  @BodySchema({
    description: 'Request body containing the Firebase ID token.',
    schema: z.object({
      token: z.string().max(2000).describe('Firebase ID token obtained from the client'),
    }),
  })
  @ResponseSchema({
    description: 'Successful response containing the session ID and user profile.',
    schema: z.object({
      sessionId: z.string().describe('Session token'),
      profile: z.object({
        uuid: z.string().describe('Unique identifier for the user'),
        nickname: z.string().describe("User's display name"),
        role: z.string().describe("User's role in the system"),
      }),
    }),
    status: 201,
  })
  async signInFirebase(@ValidatedBody() body: AuthNamespace.SignInFirebaseCommand) {
    if (typeof body.token !== 'string') {
      respondError(
        'InvalidToken',
        400,
        'Request body must be a string containing the Firebase token.'
      )
    }

    const validateResult = await this.authService.validateFirebaseToken(body.token)
    if (!validateResult) {
      respondError('Unauthorized', 401, 'Invalid Firebase token.')
    }

    const [sessionData, user] = validateResult
    const sessionId = await this.authService.createSession(sessionData)
    return {
      sessionId,
      profile: {
        uuid: user.uuid,
        nickname: user.profile_nickname,
        role: user.role,
      },
    }
  }

  // @Post('register/firebase')
  registerFirebase() {}

  signInOauth() {}

  getSessionLegacy() {}
}
