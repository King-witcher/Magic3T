import { AuthenticRequest } from '@/modules/auth/authentic-request'
import { Perspective } from '../lib'

export type MatchRequest = AuthenticRequest & {
  perspective: Perspective
}
