import { Token } from './token'

const WORD_TERMINATORS = new Set([' ', '\t', '\n', '|'])

export interface ILexer {
  lexAll(): Token[]
  next(): Token
  getLine(charPos: number): number
}

export class Lexer implements ILexer {
  private lineStarts: number[] = [0]
  private pos: number = 0

  constructor(private text: string) {}

  lexAll(): Token[] {
    const tokens: Token[] = []
    while (true) {
      const token = this.next()
      tokens.push(token)
      if (token.kind === 'eof') break
    }
    return tokens
  }

  next(): Token {
    this.skipTrivia()

    if (this.halted())
      return {
        kind: 'eof',
        pos: this.pos,
      }

    switch (this.peek()) {
      case '|': {
        this.bump()
        return {
          kind: '|',
          pos: this.pos - 1,
        }
      }
      case '\n': {
        this.bump()
        this.lineStarts.push(this.pos)
        return {
          kind: '\n',
          pos: this.pos - 1,
        }
      }
      default: {
        return this.lexWord()
      }
    }
  }

  halted() {
    return this.pos >= this.text.length
  }

  private lexWord(): Token {
    const wordPos = this.pos
    let hasQuotes = false
    let betweenQuotes: '"' | "'" | null = null
    let quotePos = 0
    let assignment = false
    let word = ''

    while (!this.halted()) {
      const char = this.peek()

      if (!betweenQuotes && (char === '"' || char === "'")) {
        hasQuotes = true
        betweenQuotes = char
        quotePos = this.pos
        this.bump()
        continue
      }

      if (betweenQuotes && char === betweenQuotes) {
        betweenQuotes = null
        this.bump()
        continue
      }

      if (char === '=' && !hasQuotes && word.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        assignment = true
        word += char
        this.bump()
        continue
      }

      if (!betweenQuotes && WORD_TERMINATORS.has(char)) {
        break
      }

      if (char === '\\' && betweenQuotes !== "'") {
        word += this.parseEscaped()
        continue
      }

      word += char
      this.bump()
    }

    if (betweenQuotes) throw this.error('unterminated quotes', quotePos)

    return {
      kind: 'word',
      assign: assignment,
      pos: wordPos,
      value: word,
    }
  }

  private parseEscaped(): string {
    this.bump()
    if (this.halted()) throw this.error('unterminated escape sequence', this.pos - 1)
    const char = this.bump()

    switch (char) {
      case 'n':
        return '\n'
      case 't':
        return '\t'
      case 'r':
        return '\r'
      case '\\':
      case '"':
      case "'":
      case ' ':
        return char
      default:
        throw this.error(`invalid escape sequence: \\${char}`, this.pos - 1)
    }
  }

  private peek() {
    return this.peekAt(0)
  }

  private peekAt(offset: number) {
    return this.text[this.pos + offset]
  }

  private bump() {
    return this.text[this.pos++]
  }

  private skipTrivia() {
    while (!this.halted()) {
      switch (this.peek()) {
        // Skips whitespace
        case ' ':
        case '\t': {
          this.bump()
          break
        }
        // Skips comments
        case '#': {
          this.skipLine()
          break
        }
        default:
          return
      }
    }
  }

  private skipLine() {
    while (!this.halted() && this.peek() !== '\n') {
      this.bump()
    }
  }

  private error(message: string, pos: number = this.pos): LexerError {
    let line = 0
    let lineStart = 0
    for (let i = 0; i < pos && i < this.text.length; i++) {
      if (this.text[i] === '\n') {
        line++
        lineStart = i + 1
      }
    }
    const newline = this.text.indexOf('\n', lineStart)
    const lineEnd = newline === -1 ? this.text.length : newline
    const lineText = this.text.slice(lineStart, lineEnd)
    return new LexerError(message, pos, line, pos - lineStart, lineText)
  }

  // TODO: understand it
  getLine(pos: number): number {
    let low = 0
    let high = this.lineStarts.length - 1

    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (this.lineStarts[mid] <= pos) low = mid
      else high = mid - 1
    }

    return low + 1
  }
}

export class LexerError extends Error {
  constructor(
    message: string,
    /** Absolute offset into the source where the error occurred. */
    readonly pos: number,
    /** Zero-based index of the line containing `pos`. */
    readonly line: number,
    /** Zero-based column within that line. */
    readonly column: number,
    /** Full text of the offending line, for rendering a caret. */
    readonly lineText: string
  ) {
    super(message)
    this.name = 'LexerError'
  }
}
