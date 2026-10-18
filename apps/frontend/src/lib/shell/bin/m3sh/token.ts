export type Op = '|' | '\n' | 'eof'

export type Token =
  | {
      kind: Op
      pos: number
    }
  | {
      kind: 'word'
      value: string
      pos: number
      assign: boolean
    }
