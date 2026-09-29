import { Injectable } from '@nestjs/common'
import { App, cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app'
import { Auth, getAuth } from 'firebase-admin/auth'
import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { unexpected } from '@/common'

@Injectable()
export class FirebaseService {
  public readonly firestore: Firestore
  public readonly firebaseAuth: Auth
  public readonly firebase: App

  constructor() {
    const credentials = this.getCredentials()

    this.firebase =
      getApps()[0] ||
      initializeApp({
        credential: cert(credentials),
      })

    this.firestore = getFirestore(process.env.FIRESTORE_DB)
    this.firebaseAuth = getAuth(this.firebase)
  }

  getCredentials(): ServiceAccount {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY)
      unexpected('Firebase Admin credentials not found on environment')

    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Env providers often store the PEM with escaped "\n" instead of real line breaks.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }
}
