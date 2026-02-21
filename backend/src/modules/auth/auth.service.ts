import { Injectable } from '@nestjs/common'
import { UserRecord } from 'firebase-admin/auth'
import { FirebaseService } from '@/infra/firebase'

@Injectable()
export class AuthService {
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Removes "Bearer " prefix from the token if present and validate the token, returning the user id.
   *
   * Returns null if the token is invalid.
   */
  async validateToken(token: string): Promise<string | null> {
    token = token.replace('Bearer ', '')
    try {
      const decoded = await this.firebaseService.firebaseAuth.verifyIdToken(token)
      return decoded.uid
    } catch {
      return null
    }
  }

  /**
   * Gets all user records from Firebase Auth, up to 100.
   */
  async listAccounts(nextPageToken?: string): Promise<[UserRecord[], string?]> {
    const firebaseAuth = this.firebaseService.firebaseAuth
    const listResult = await firebaseAuth.listUsers(100, nextPageToken)
    return [listResult.users, listResult.pageToken]
  }
}
