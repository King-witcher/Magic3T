import { Match } from '@magic3t/api-types'
import { ErrorResponseException } from '@/common'

export function matchException(errorCode: Match.MatchError, httpStatus = 400): never {
  throw new ErrorResponseException<Match.MatchError>(errorCode, httpStatus)
}
