import {
  RegisterCommand,
  RegisterFirebaseCommand,
  RegisterFirebaseResponse,
  RegisterResult,
  SignInFirebaseCommand,
  SignInFirebaseResponse,
  ValidateSessionResponse,
} from '@magic3t/api-types'
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import z from 'zod'
import { respondError, unexpected } from '@/common'
import { BodySchema } from '@/common/decorators/body-schema.decorator'
import { ResponseSchema } from '@/common/decorators/response-schema.decorator'
import { UserRepository } from '@/infra/database/repositories'
import { NICKNAME_SCHEMA } from '@/shared/validation'
import { USERNAME_SCHEMA } from '@/shared/validation/username'
import { AuthGuard } from './auth.guard'
import { AuthControllerService } from './auth-controller.service'
import { SessionId, UserId } from './decorators'

@Controller('auth')
export class AuthController {
  constructor(
    private service: AuthControllerService,
    private userRepository: UserRepository
  ) {}

  /**
   * Signs in a user using a Firebase token.
   */
  @Post('firebase/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Firebase',
    description:
      'Signs in a user using a Firebase token, returning a session ID and user profile on success.',
  })
  @BodySchema({
    description: 'Request body containing the Firebase ID token.',
    schema: z.object({
      token: z.jwt().max(2000).describe('Firebase ID token obtained from the client'),
    }),
  })
  @ResponseSchema({
    description: 'Successfully signed in.',
    schema: z.object({
      status: z.enum(['unregistered', 'registered']).describe('Indicates the sign-in status'),
      sessionId: z.string().describe('Session token').nullable(),
      sessionData: z
        .object({
          uuid: z.string().describe('Unique identifier for the user'),
          nickname: z.string().describe("User's display name"),
          summonerIcon: z.number().describe("User's summoner icon"),
          role: z.string().describe("User's role in the system"),
        })
        .nullable(),
    }),
    status: HttpStatus.OK,
  })
  @ResponseSchema({
    description: 'The token is invalid.',
    schema: z.object({
      errorCode: z.literal('InvalidFirebaseToken'),
      metadata: z.string(),
    }),
    status: HttpStatus.UNAUTHORIZED,
  })
  async signInFirebase(@Body() body: SignInFirebaseCommand): Promise<SignInFirebaseResponse> {
    const validateResult = await this.service.validateFirebaseToken(body.token)

    const user = await this.userRepository.getByFirebaseId(validateResult.uid)
    if (!user) {
      return {
        status: 'unregistered',
        sessionId: null,
        sessionData: null,
      }
    }

    const sessionId = await this.service.createSession({
      id: user.id,
      uuid: user.uuid,
      role: user.role,
    })

    const clientSession = this.service.getClientSessionDataFromRow(user)

    return {
      status: 'registered',
      sessionId,
      sessionData: clientSession,
    }
  }

  @Post('firebase/register')
  @ApiOperation({
    summary: 'Register with Firebase',
    description:
      'Registers a new user using a Firebase token and a nickname, returning a session ID and user profile on success.',
  })
  @BodySchema({
    schema: z.object({
      token: z.string().describe('Firebase ID token obtained from the client'),
      data: z.object({
        nickname: NICKNAME_SCHEMA.describe('Desired nickname for the new account'),
      }),
    }),
  })
  @ResponseSchema({
    description: 'Successfully registered and signed in.',
    schema: z.object({
      sessionId: z.string().describe('Session token'),
      sessionData: z.object({
        uuid: z.string().describe('Unique identifier for the user'),
        nickname: z.string().describe("User's display name"),
        summonerIcon: z.number().describe("User's summoner icon"),
        role: z.literal('player').describe("User's role in the system"),
      }),
    }),
    status: HttpStatus.CREATED,
  })
  @ResponseSchema({
    description:
      'The token is valid, but either the nickname is already taken or the user is already registered.',
    schema: z.object({
      errorCode: z.enum(['NicknameUnavailable', 'UserAlreadyRegistered']),
      metadata: z.any().describe('Some extra information'),
    }),
    status: HttpStatus.CONFLICT,
  })
  @ResponseSchema({
    description: 'The token is invalid.',
    schema: z.object({
      errorCode: z.literal('InvalidFirebaseToken'),
      metadata: z.any(),
    }),
    status: HttpStatus.UNAUTHORIZED,
  })
  async registerFirebase(@Body() body: RegisterFirebaseCommand): Promise<RegisterFirebaseResponse> {
    const validateResult = await this.service.validateFirebaseToken(body.token)

    // TODO: Optimize it
    const existingUser = await this.userRepository.getByFirebaseId(validateResult.uid)
    if (existingUser) {
      respondError('UserAlreadyRegistered', HttpStatus.CONFLICT, 'The user is already registered.')
    }

    const user = await this.service.registerFirebaseUser(validateResult, body.data.nickname)

    // After registration, sign in the user by reusing the sign-in logic
    const sessionId = await this.service.createSession({
      id: user.id,
      uuid: user.uuid,
      role: user.role,
    })

    const clientSession = this.service.getClientSessionDataFromRow(user)

    return {
      sessionId,
      sessionData: clientSession,
    }
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register',
    description: 'Registers a new user with the provided information.',
  })
  @BodySchema({
    description: 'Request body containing registration information.',
    schema: z.object({
      nickname: NICKNAME_SCHEMA.describe('Desired nickname for the new account'),
      username: USERNAME_SCHEMA.describe('Desired username for the new account'),
      password: z
        .string()
        .min(8)
        .max(128)
        .regex(/[a-zA-Z]+/, 'Password must contain at least one letter')
        .regex(/[0-9]+/, 'Password must contain at least one number')
        .describe('Password for the new account'),
    }),
  })
  @ResponseSchema({
    status: HttpStatus.CREATED,
    description: 'Successfully registered.',
    schema: z.object({
      sessionId: z.string().describe('Session token'),
      sessionData: z.object({
        uuid: z.uuid().describe('Unique identifier for the user'),
        nickname: NICKNAME_SCHEMA.describe("User's nickname"),
        summonerIcon: z.number().describe("User's summoner icon"),
        role: z.literal('player').describe("User's role in the system"),
      }),
    }),
  })
  @ResponseSchema({
    status: HttpStatus.CONFLICT,
    description: 'The nickname or username is already taken.',
    schema: z.object({
      errorCode: z.enum(['NicknameAlreadyTaken', 'UsernameAlreadyTaken']),
      metadata: z.any().optional(),
    }),
  })
  @ResponseSchema({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description:
      "Too many requests. You can't register more than 5 times per hour from the same IP.",
    schema: z.object({
      errorCode: z.literal('TooManyRequests'),
      metadata: z.any().optional(),
    }),
  })
  @Throttle({ medium: { limit: 10 }, long: { limit: 30 } })
  async register(@Body() body: RegisterCommand): Promise<RegisterResult> {
    const user = await this.service.registerWithCredential(body)
    const sessionId = await this.service.createSession({
      id: user.id,
      uuid: user.uuid,
      role: user.role,
    })
    const clientSession = this.service.getClientSessionDataFromRow(user)

    return {
      sessionId,
      sessionData: clientSession,
    }
  }

  @Get('validate-session')
  @ApiOperation({
    summary: 'Get current authenticated profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ResponseSchema({
    description: 'Successfully retrieved user profile.',
    schema: z.object({
      uuid: z.uuid().describe('Unique identifier for the user'),
      nickname: z.string().describe("User's display name"),
      summonerIcon: z.number().describe("User's summoner icon"),
      role: z.string().describe("User's role in the system"),
    }),
    status: HttpStatus.OK,
  })
  @UseGuards(AuthGuard)
  async validateSession(@UserId() id: number): Promise<ValidateSessionResponse> {
    const user = await this.userRepository.getById(id)
    if (!user) unexpected('Session is valid but no user found. This should not happen.')

    return {
      uuid: user.uuid,
      nickname: user.profile_nickname,
      summonerIcon: user.profile_icon,
      role: user.role,
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidates the current user session id.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  async logout(@SessionId() id: string): Promise<void> {
    await this.service.deleteSession(id)
  }
}
