import { randomUUID } from 'node:crypto'
import { ClientSessionData, RegisterCommand } from '@magic3t/api-types'
import { UserRow, UserRowRole } from '@magic3t/database-types'
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
import { SessionData as ServerSessionData } from '@/shared/types/session-data'

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7

@Injectable()
export class PrivateAuthService {
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

  async registerLegacy(nickname: string, firebaseId: string, email: string): Promise<UserRow> {
    try {
      const user = await this.databaseService.transaction(async (client) => {
        const user = await this.userRepository.createWithNickname(nickname, client)
        await this.identityRepository.createLegacyIdentity(
          {
            email: email,
            firebase_id: firebaseId,
            user_id: user.id,
          },
          client
        )
        return user
      })

      return user
    } catch (error) {
      if (error instanceof DatabaseError && error.code === PgErrorCode.UniqueViolation) {
        switch (error.cause.constraint) {
          case 'user_identity_firebase_id_pkey':
          case 'user_identity_email_key':
            respondError('UserAlreadyRegistered', HttpStatus.CONFLICT)
            break
          case 'user_nickname_key':
            respondError('NicknameAlreadyTaken', HttpStatus.CONFLICT)
            break
        }
      }
      throw error
    }
  }

  async registerWithCredentials(
    nickname: string,
    username: string,
    password: string
  ): Promise<UserRow> {
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
  async validateCredentials(
    username: string,
    password: string
  ): Promise<{
    id: number
    uuid: string
    nickname: string
    role: UserRowRole
    profile_icon: number
  }> {
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

    return {
      id: credential.id,
      uuid: credential.uuid,
      nickname: credential.nickname,
      role: credential.role,
      profile_icon: credential.profile_icon,
    }
  }

  async createSession(userId: number, userUUID: string, userRole: UserRowRole): Promise<string> {
    const sessionData: ServerSessionData = {
      id: userId,
      uuid: userUUID,
      role: userRole,
    }
    const sessionToken = `MT3SID${randomUUID()}`
    this.cacheManager.set(`session:${sessionToken}`, sessionData, ONE_WEEK)
    return sessionToken
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(`session:${sessionId}`)
  }

  private async digestPassword(password: string): Promise<string> {
    const digest = await bcrypt.hash(password, 12)
    return digest
  }
}
