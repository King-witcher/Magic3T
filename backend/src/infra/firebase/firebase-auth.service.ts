import { Injectable } from '@nestjs/common'
import { DecodedIdToken, UserRecord } from 'firebase-admin/auth'
import { FirebaseService } from './firebase.service'

@Injectable()
export class FirebaseAuthService {
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
      console.log(token)
      const decoded = await this.firebaseService.firebaseAuth.verifyIdToken(token)
      return decoded
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
