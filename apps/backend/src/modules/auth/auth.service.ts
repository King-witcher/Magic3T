import { randomBytes } from 'node:crypto'
import {
  AuthErrorCode,
  ClientSessionData,
  LoginResult,
  RegisterFirebaseResponse,
  RegisterResult,
  SignInFirebaseResponse,
  ValidateSessionResponse,
} from '@magic3t/api-types'
import { UserRow, UserRowRole } from '@magic3t/database-types'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'
import { Cache } from 'cache-manager'
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
export class AuthService {
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private databaseService: DatabaseService,
    private userRepository: UserRepository,
    private identityRepository: IdentityRepository,
    private credentialRepository: CredentialRepository
  ) {}

  async signInFirebase(token: string): Promise<SignInFirebaseResponse> {
    const decoded = await this.validateFirebaseToken(token)

    const user = await this.userRepository.getByFirebaseId(decoded.uid)
    if (!user) {
      return { status: 'unregistered', sessionId: null, sessionData: null }
    }

    const sessionId = await this.createSession(user.id, user.uuid, user.role)
    return {
      status: 'registered',
      sessionId,
      sessionData: this.toClientSession(user),
    }
  }

  async registerFirebase(token: string, nickname: string): Promise<RegisterFirebaseResponse> {
    const decoded = await this.validateFirebaseToken(token)
    if (!decoded.email) {
      unexpected('Email should be present in the decoded Firebase token. This should not happen.')
    }

    const user = await this.registerLegacy(nickname, decoded.uid, decoded.email)
    const sessionId = await this.createSession(user.id, user.uuid, user.role)

    return { sessionId, sessionData: this.toClientSession(user) }
  }

  async register(nickname: string, username: string, password: string): Promise<RegisterResult> {
    const user = await this.registerWithCredentials(nickname, username, password)
    const sessionId = await this.createSession(user.id, user.uuid, user.role)

    return { sessionId, sessionData: this.toClientSession(user) }
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.validateCredentials(username, password)
    const sessionId = await this.createSession(user.id, user.uuid, user.role)

    return {
      sessionId,
      sessionData: {
        nickname: user.profile_nickname,
        summonerIcon: user.profile_icon,
        role: user.role,
        uuid: user.uuid,
      },
    }
  }

  async getSessionProfile(userId: number): Promise<ValidateSessionResponse> {
    const user = await this.userRepository.getById(userId)
    if (!user) unexpected('Session is valid but no user found. This should not happen.')

    return this.toClientSession(user)
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(`session:${sessionId}`)
  }

  private toClientSession(user: {
    uuid: string
    profile_nickname: string
    profile_icon: number
    role: UserRowRole
  }): ClientSessionData {
    return {
      uuid: user.uuid,
      nickname: user.profile_nickname,
      summonerIcon: user.profile_icon,
      role: user.role,
    }
  }

  private async validateFirebaseToken(firebaseToken: string) {
    const decoded = await this.firebaseAuthService.validateToken(firebaseToken)
    if (!decoded) {
      respondError('InvalidFirebaseToken', HttpStatus.UNAUTHORIZED)
    }
    return decoded
  }

  private async registerLegacy(
    nickname: string,
    firebaseId: string,
    email: string
  ): Promise<UserRow> {
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

  private async registerWithCredentials(
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
          respondError(AuthErrorCode.NicknameUnavailable, HttpStatus.CONFLICT)
        }
        throw error
      })
      await this.credentialRepository
        .create(username, passwordDigest, user.id, conn)
        .catch((error) => {
          if (error instanceof DatabaseError && error.cause.constraint === 'user_credential_pkey') {
            respondError(AuthErrorCode.UsernameUnavailable, HttpStatus.CONFLICT)
          }
          throw error
        })
      return user
    })
    return user
  }

  private async validateCredentials(
    username: string,
    password: string
  ): Promise<{
    id: number
    uuid: string
    profile_nickname: string
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
      profile_nickname: credential.profile_nickname,
      role: credential.role,
      profile_icon: credential.profile_icon,
    }
  }

  private async createSession(
    userId: number,
    userUUID: string,
    userRole: UserRowRole
  ): Promise<string> {
    const sessionData: ServerSessionData = {
      id: userId,
      uuid: userUUID,
      role: userRole,
    }
    const sessionToken = this.generateSessionId()
    this.cacheManager.set(`session:${sessionToken}`, sessionData, ONE_WEEK)
    return sessionToken
  }

  private async digestPassword(password: string): Promise<string> {
    const digest = await bcrypt.hash(password, 12)
    return digest
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('base64url')
  }
}
