import { ClientSessionData } from '../../common'

export type SignInFirebaseCommand = {
  token: string
}

export type SignInFirebaseResponse =
  | {
      status: 'unregistered'
      sessionId: null
      sessionData: null
    }
  | {
      status: 'registered'
      sessionId: string
      sessionData: ClientSessionData
    }
