import { ClientSessionData } from '../../common'

export type RegisterCommand = {
  nickname: string
  username: string
  password: string
}

export type RegisterResult = {
  sessionId: string
  sessionData: ClientSessionData
}

export type RegisterErrorCode = 'UsernameAlreadyExists' | 'NicknameAlreadyTaken'
