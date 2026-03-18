import { Match } from '@magic3t/api-types'
import { ErrorResponseException } from '@/common'

/** Throw a match error */
export function matchException(errorCode: Match.MatchError, httpStatus = 400): never {
  throw new ErrorResponseException<Match.MatchError>(errorCode, httpStatus)
}
