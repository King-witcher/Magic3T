import { ErrorResponse } from '@magic3t/api-types'

/**
 * Represents an error response to be sent to the client.
 *
 * Used to standardize error handling across HTTP and WebSocket.
 */
export class ErrorResponseException<T extends string = string>
  extends Error
  implements ErrorResponse<T>
{
  /** A unique error code identifying the error */
  public readonly errorCode: T
  /** The HTTP status code to be sent in HTTP responses */
  public readonly httpStatus: number
  /** Additional metadata related to the error */
  public readonly metadata?: any

  constructor(errorCode: T, httpStatus = 400, metadata?: any) {
    super(errorCode)
    this.name = errorCode

    this.errorCode = errorCode
    this.metadata = metadata
    this.httpStatus = httpStatus
  }

  /**
   * Gets the error response object to be sent to the client.
   */
  get response(): ErrorResponse<T> {
    return {
      errorCode: this.errorCode,
      metadata: this.metadata,
    }
  }
}

/**
 * Throws an ErrorResponseException with the given parameters.
 */

// biome-ignore lint/suspicious/noExplicitAny: metadata can be anything for now
export function respondError(errorCode: string, httpStatus = 400, metadata?: any): never {
  throw new ErrorResponseException(errorCode, httpStatus, metadata)
}
