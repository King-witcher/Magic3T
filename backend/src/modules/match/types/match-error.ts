import { Match } from '@magic3t/api-types'
import { ErrorResponseException } from '@/common'

/** Throw a match error */
export function matchException(errorCode: Match.Error, httpStatus = 400): never {
  throw new ErrorResponseException<Match.Error>(errorCode, httpStatus)
}
