import { ClientSessionData } from '../../common'

export type LoginCommand = {
  username: string
  password: string
}

export type LoginResult = {
  sessionId: string
  sessionData: ClientSessionData
}
