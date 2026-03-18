import { HttpStatus } from '@nestjs/common'

/** @deprecated */
export class OldBaseError {
  constructor(
    public readonly message: string,
    public readonly httpStatus: HttpStatus
  ) {}
}
