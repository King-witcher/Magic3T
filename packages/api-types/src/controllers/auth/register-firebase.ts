import { ClientSessionData } from '../../common'

export type RegisterFirebaseCommand = {
  token: string
  data: {
    nickname: string
  }
}

export type RegisterFirebaseResponse = {
  sessionId: string
  sessionData: ClientSessionData
}
