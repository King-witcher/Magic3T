/**
 * Represents an unexpected error that occurred in the application and shouldn't be seen by the user.
 *
 * Results in an opaque 500 Internal Server Error response.
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: Anything can be logged */
export class UnexpectedError extends Error {
  name: string = 'UnexpectedError'

  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) {
    super(message)
  }
}

export function unexpected(message = 'An unexpected state was reached.', metadata?: any): never {
  throw new UnexpectedError(message, metadata)
}
