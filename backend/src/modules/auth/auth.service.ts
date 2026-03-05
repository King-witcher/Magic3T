import { randomUUID } from 'node:crypto'
import { UserRow } from '@magic3t/database-types'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { UserRecord } from 'firebase-admin/auth'
import { respondError, unexpected } from '@/common'
import { UserRepository } from '@/infra/database/repositories'
import { FirebaseService } from '@/infra/firebase'
import { SessionData } from '@/shared/types/session-data'

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async validateFirebaseToken(firebaseToken: string): Promise<[SessionData, UserRow]> {
    const decoded = await this.firebaseService.firebaseAuth
      .verifyIdToken(firebaseToken)
      .catch(() => {
        respondError('InvalidFirebaseToken', HttpStatus.UNAUTHORIZED)
      })

    const user = await this.userRepository.getByFirebaseId(decoded.uid)

    if (!user) {
      unexpected(
        'UserNotFound',
        `User with Firebase ID ${decoded.uid} not found in database after successful token verification.`
      )
    }

    return [
      {
        id: user.id,
        role: user.role,
        uuid: user.uuid,
      },
      user,
    ]
  }

  async createSession(sessionData: SessionData): Promise<string> {
    const sessionToken = `MT3SID${randomUUID()}`
    this.cacheManager.set(`session:${sessionToken}`, sessionData, 60 * 60 * 24 * 7) // 7 days
    return sessionToken
  }

  async deleteSession(token: string): Promise<void> {
    await this.cacheManager.del(`session:${token}`)
  }

  async getSession(token: string): Promise<SessionData | null> {
    const session = await this.cacheManager.get<SessionData>(`session:${token}`)
    return session ?? null
  }

  /**
   * Gets all user records from Firebase Auth, up to 100.
   */
  async listFirebaseAccounts(nextPageToken?: string): Promise<[UserRecord[], string?]> {
    const firebaseAuth = this.firebaseService.firebaseAuth
    const listResult = await firebaseAuth.listUsers(100, nextPageToken)
    return [listResult.users, listResult.pageToken]
  }
}
