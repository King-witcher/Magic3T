import { Body, Controller, Post } from '@nestjs/common'
import { respondError } from '@/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin/firebase')
  async signInFirebase(@Body() body: string) {
    if (typeof body !== 'string') {
      respondError(
        'InvalidToken',
        400,
        'Request body must be a string containing the Firebase token.'
      )
    }

    const validateResult = await this.authService.validateFirebaseToken(body)
    if (!validateResult) {
      respondError('Unauthorized', 401, 'Invalid Firebase token.')
    }

    const [sessionData, user] = validateResult
    const sessionId = await this.authService.createSession(sessionData)
    return {
      sessionId,
      profile: {
        uuid: user.id,
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
