import {
  AuthErrorCode,
  LoginCommand,
  LoginResult,
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
import { BodySchema } from '@/common/decorators/body-schema.decorator'
import { ResponseSchema } from '@/common/decorators/response-schema.decorator'
import { NICKNAME_SCHEMA } from '@/shared/validation'
import { PASSWORD_SCHEMA } from '@/shared/validation/password'
import { USERNAME_SCHEMA } from '@/shared/validation/username'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { SessionId, UserId } from './decorators'

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

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
  async loginFirebase(@Body() body: SignInFirebaseCommand): Promise<SignInFirebaseResponse> {
    return this.service.signInFirebase(body.token)
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
      errorCode: z.enum([AuthErrorCode.NicknameUnavailable, AuthErrorCode.UserAlreadyRegistered]),
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
  async registerFromFirebase(
    @Body() body: RegisterFirebaseCommand
  ): Promise<RegisterFirebaseResponse> {
    return this.service.registerFirebase(body.token, body.data.nickname)
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
      password: PASSWORD_SCHEMA.describe('Password for the new account'),
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
      errorCode: z.enum([AuthErrorCode.NicknameUnavailable, AuthErrorCode.UsernameUnavailable]),
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
    return this.service.register(body.nickname, body.username, body.password)
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticates a user with their username and password.',
  })
  @BodySchema({
    description: 'Request body containing login credentials.',
    schema: z.object({
      username: USERNAME_SCHEMA.describe('The username of the account'),
      password: z.string().min(1).describe('The password of the account'),
    }),
  })
  @ResponseSchema({
    status: HttpStatus.OK,
    description: 'Successfully authenticated.',
    schema: z.object({
      sessionId: z.string().describe('Session token'),
      sessionData: z.object({
        uuid: z.uuid().describe('Unique identifier for the user'),
        nickname: z.string().describe("User's nickname"),
        summonerIcon: z.number().describe("User's summoner icon"),
        role: z.enum(['player', 'admin', 'superuser']).describe("User's role in the system"),
      }),
    }),
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginCommand): Promise<LoginResult> {
    return this.service.login(body.username, body.password)
  }

  @Get('session')
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
    return this.service.getSessionProfile(id)
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
