import { Request } from 'express'
import { SessionData } from '@/shared/types/session-data'

export interface AuthenticRequest extends Request {
  session: SessionData
}
