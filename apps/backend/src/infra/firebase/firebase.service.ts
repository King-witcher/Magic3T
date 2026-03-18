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
    try {
      if (!process.env.FIREBASE_ADMIN_CREDENTIALS)
        unexpected('Firebase Admin credentials not found on environment')
      return JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS, 'base64').toString())
    } catch (e) {
      unexpected('Failed to parse Firebase Admin credentials from environment', e)
    }
  }
}
