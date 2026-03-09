import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, provider } from '@/services/firebase'

export class FirebaseClient {
  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(auth, provider)
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async registerWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  async signOut(): Promise<void> {
    await signOut(auth)
  }

  onAuthStateChanged(callback: (userId: string | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      callback(user ? user.uid : null)
    })
    return unsubscribe
  }

  public get token(): Promise<string | null> {
    return this.getToken()
  }

  public get userId(): string | null {
    return auth.currentUser?.uid ?? null
  }

  public get authenticated(): boolean {
    return auth.currentUser != null
  }

  private async getToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return getIdToken(user, true)
  }
}

// This is a singleton instance of the FirebaseClient for now.
export const firebaseClient = new FirebaseClient()
