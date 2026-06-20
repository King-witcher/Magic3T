import { Injectable, Logger } from '@nestjs/common'
import { DecodedIdToken, FirebaseAuthError } from 'firebase-admin/auth'
import { FirebaseService } from './firebase.service'

@Injectable()
export class FirebaseAuthService {
  private readonly logger = new Logger(FirebaseAuthService.name, { timestamp: true })
  constructor(private firebaseService: FirebaseService) {}

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
