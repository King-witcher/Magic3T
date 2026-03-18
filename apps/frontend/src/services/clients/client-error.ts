export class ClientError extends Error {
  constructor(
    public readonly request: Request,
    public readonly response: Response,
    public readonly statusCode: number,
    message?: string
  ) {
    super(message)
  }

  /**
   * Gets the error code from the response body, if available.
   *
   * Error codes are application-specific codes used to discriminate errors.
   */
  public get errorCode(): Promise<string | null> {
    return this.getErrorCode()
  }

  /**
   * Gets the error description from the response body, if available.
   *
   * The error description provides a human-readable explanation of the error, mostly for debugging purposes.
   */
  public get errorDescription(): Promise<string | null> {
    return this.getErrorDescription()
  }

  private async getErrorCode(): Promise<string | null> {
    const data = await this.response.json().catch(() => null)
    return data?.errorCode ?? null
  }

  private async getErrorDescription(): Promise<string | null> {
    const data = await this.response.json().catch(() => null)
    return data?.errorDescription ?? null
  }
}

export class NotFoundError extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 404, message)
  }
}

export const RateLimitError = class extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 429, message)
  }
}

export class UnauthorizedError extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 401, message)
  }
}

export class ForbiddenError extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 403, message)
  }
}

export class BadRequestError extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 400, message)
  }
}

export class InternalServerError extends ClientError {
  constructor(request: Request, response: Response, message?: string) {
    super(request, response, 500, message)
  }
}
