import { randomUUID } from 'node:crypto'
import { UserRow } from '@magic3t/database-types'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { DecodedIdToken } from 'firebase-admin/auth'
import { respondError, unexpected } from '@/common'
import { DatabaseService } from '@/infra/database'
import { IdentityRepository, UserRepository } from '@/infra/database/repositories'
import { FirebaseAuthService } from '@/infra/firebase'
import { SessionData } from '@/shared/types/session-data'

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7

@Injectable()
export class AuthService {
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseService: DatabaseService,
    private userRepository: UserRepository,
    private identityRepository: IdentityRepository
  ) {}

  async validateFirebaseToken(firebaseToken: string): Promise<DecodedIdToken> {
    const decoded = await this.firebaseAuthService.validateToken(firebaseToken)
    if (!decoded) {
      respondError('InvalidFirebaseToken', HttpStatus.UNAUTHORIZED)
    }
    return decoded
  }

  async registerFirebaseUser(decodedToken: DecodedIdToken, nickname: string): Promise<UserRow> {
    // This should never happen, as the token would be rejected in validateFirebaseToken
    const email = decodedToken.email
    if (!email) {
      unexpected('Decoded Firebase token is missing email')
    }

    const user = await this.databaseService.transaction(async (client) => {
      const user = await this.userRepository.create(nickname, client)
      await this.identityRepository.createFirebaseIdentity(
        {
          email: email,
          firebase_id: decodedToken.uid,
          user_id: user.id,
        },
        client
      )
      return user
    })

    return user
  }

  async createSession(sessionData: SessionData): Promise<string> {
    const sessionToken = `MT3SID${randomUUID()}`
    this.cacheManager.set(`session:${sessionToken}`, sessionData, ONE_WEEK)
    return sessionToken
  }

  async deleteSession(token: string): Promise<void> {
    await this.cacheManager.del(`session:${token}`)
  }

  async getSession(token: string): Promise<SessionData | null> {
    const session = await this.cacheManager.get<SessionData>(`session:${token}`)
    return session ?? null
  }
}
