import { SignInFirebaseCommand, SignInFirebaseResponse } from '@magic3t/api-types'
import { Controller, HttpStatus, Post, Res } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { Response } from 'express'
import z from 'zod'
import { respondError, ValidatedBody } from '@/common'
import { BodySchema } from '@/common/decorators/body-schema.decorator'
import { ResponseSchema } from '@/common/decorators/response-schema.decorator'
import { UserRepository } from '@/infra/database/repositories'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userRepository: UserRepository
  ) {}

  /**
   * Signs in a user using a Firebase token.
   */
  @Post('signin/firebase')
  @ApiOperation({
    summary: 'Sign in with Firebase',
    description:
      'Signs in a user using a Firebase token, returning a session ID and user profile on success.',
  })
  @BodySchema({
    description: 'Request body containing the Firebase ID token.',
    schema: z.object({
      token: z
        .jwt()
        .max(2000)
        .default('aaaa.bbbb.cccc')
        .describe('Firebase ID token obtained from the client'),
    }),
  })
  @ResponseSchema({
    description: 'Successful response containing the session ID and user profile.',
    schema: z.object({
      status: z.literal('signed_in').describe('Indicates a successful sign-in'),
      sessionId: z.string().describe('Session token'),
      profile: z.object({
        uuid: z.string().describe('Unique identifier for the user'),
        nickname: z.string().describe("User's display name"),
        summonerIcon: z.number().describe("User's summoner icon"),
        role: z.string().describe("User's role in the system"),
      }),
    }),
    status: 201,
  })
  @ResponseSchema({
    description: 'The token is valid, but the user is not registered yet.',
    schema: z.object({
      status: z
        .literal('unregistered_user')
        .describe('Indicates the user is not registered in the system'),
    }),
    status: 200,
  })
  async signInFirebase(
    @ValidatedBody() body: SignInFirebaseCommand,
    @Res() res: Response
  ): Promise<SignInFirebaseResponse> {
    if (typeof body.token !== 'string') {
      respondError(
        'InvalidToken',
        400,
        'Request body must be a string containing the Firebase token.'
      )
    }

    const validateResult = await this.authService.validateFirebaseToken(body.token)

    const user = await this.userRepository.getByFirebaseId(validateResult.uid)
    if (!user) {
      respondError(
        'UnregisteredUser',
        HttpStatus.UNAUTHORIZED,
        'The token is valid but the user is not registered yet.'
      )
    }

    const sessionId = await this.authService.createSession({
      id: user.id,
      uuid: user.uuid,
      role: user.role,
    })

    return {
      sessionId,
      profile: {
        uuid: user.uuid,
        summonerIcon: user.profile_icon,
        nickname: user.profile_nickname,
        role: user.role,
      },
    }
  }

  // @Post('register/firebase')
  registerFirebase() {}
}
