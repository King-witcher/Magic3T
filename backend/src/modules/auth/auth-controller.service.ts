import { randomUUID } from 'node:crypto'
import { ClientSessionData, RegisterCommand } from '@magic3t/api-types'
import { UserRow } from '@magic3t/database-types'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'
import { Cache } from 'cache-manager'
import { DecodedIdToken } from 'firebase-admin/auth'
import { respondError, unexpected } from '@/common'
import { DatabaseError, DatabaseService, PgErrorCode } from '@/infra/database'
import {
  CredentialRepository,
  IdentityRepository,
  UserRepository,
} from '@/infra/database/repositories'
import { FirebaseAuthService } from '@/infra/firebase'
import { SessionData } from '@/shared/types/session-data'

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7

@Injectable()
export class AuthControllerService {
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseService: DatabaseService,
    private userRepository: UserRepository,
    private identityRepository: IdentityRepository,
    private credentialRepository: CredentialRepository
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

    try {
      const user = await this.databaseService.transaction(async (client) => {
        const user = await this.userRepository.createWithNickname(nickname, client)
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
    } catch (error) {
      if (error instanceof DatabaseError && error.code === PgErrorCode.UniqueViolation) {
        respondError('NicknameAlreadyTaken', HttpStatus.CONFLICT)
      }
      throw error
    }
  }

  async registerWithCredential({
    nickname,
    password,
    username,
  }: RegisterCommand): Promise<UserRow> {
    const passwordDigest = await this.digestPassword(password)
    const user = await this.databaseService.transaction(async (conn) => {
      const user = await this.userRepository.createWithNickname(nickname, conn).catch((error) => {
        if (
          error instanceof DatabaseError &&
          error.cause.constraint === 'user_profile_nickname_slug_key'
        ) {
          respondError('NicknameAlreadyTaken', HttpStatus.CONFLICT)
        }
        throw error
      })
      await this.credentialRepository
        .create(username, passwordDigest, user.id, conn)
        .catch((error) => {
          if (error instanceof DatabaseError && error.cause.constraint === 'user_credential_pkey') {
            respondError('UsernameAlreadyTaken', HttpStatus.CONFLICT)
          }
          throw error
        })
      return user
    })
    return user
  }

  /** Validates user credentials and return a user row */
  async validateCredentials(username: string, password: string): Promise<UserRow> {
    const credential = await this.credentialRepository.findByUsername(username)
    if (!credential) {
      // Prevent timing attacks by hashing anyway
      await bcrypt.compare(password, '$2b$12$invalidsaltinvalidsaltinv.uNq')
      respondError('InvalidCredentials', HttpStatus.UNAUTHORIZED)
    }

    const passwordMatches = await bcrypt.compare(password, credential.password_digest)
    if (!passwordMatches) {
      respondError('InvalidCredentials', HttpStatus.UNAUTHORIZED)
    }

    const user = await this.userRepository.getById(credential.user_id)
    if (!user) {
      unexpected(`User with ID ${credential.user_id} not found for valid credential`)
    }

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

  getClientSessionDataFromRow(
    user: Pick<UserRow, 'profile_icon' | 'uuid' | 'role' | 'profile_nickname'>
  ): ClientSessionData {
    return {
      summonerIcon: user.profile_icon,
      uuid: user.uuid,
      role: user.role,
      nickname: user.profile_nickname,
    }
  }

  private async digestPassword(password: string): Promise<string> {
    const digest = await bcrypt.hash(password, 12)
    return digest
  }
}
