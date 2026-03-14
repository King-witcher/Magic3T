import { Injectable, Logger } from '@nestjs/common'
import { DecodedIdToken, FirebaseAuthError, UserRecord } from 'firebase-admin/auth'
import { FirebaseService } from './firebase.service'

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name, { timestamp: true })
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Gets all user records from Firebase Auth, up to 100.
   */
  async listFirebaseAccounts(nextPageToken?: string): Promise<[UserRecord[], string?]> {
    const firebaseAuth = this.firebaseService.firebaseAuth
    const listResult = await firebaseAuth.listUsers(100, nextPageToken)
    return [listResult.users, listResult.pageToken]
  }

  async validateToken(token: string): Promise<DecodedIdToken | null> {
    try {
      const decoded = await this.firebaseService.firebaseAuth.verifyIdToken(token)
      return decoded
    } catch (e) {
      if (e instanceof FirebaseAuthError) {
        this.logger.error(`Failed to validate Firebase token: ${e.code}`)
      }
      return null
    }
  }
}
