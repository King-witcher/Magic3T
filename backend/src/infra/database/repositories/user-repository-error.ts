export type UserRepositoryErrorType = 'NicknameAlreadyTaken' | 'DatabaseError'

export class UserRepositoryError extends Error {
  constructor(public readonly code: UserRepositoryErrorType) {
    super(code)
    this.name = 'UserRepositoryError'
  }
}
