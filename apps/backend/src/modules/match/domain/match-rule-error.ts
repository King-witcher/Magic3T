export type MatchRuleErrorType = 'WrongTurn' | 'MatchFinished' | 'ChoiceUnavailable'

export class MatchRuleError extends Error {
  name = 'MatchRuleError'

  constructor(public readonly type: MatchRuleErrorType) {
    super(type)
  }
}
