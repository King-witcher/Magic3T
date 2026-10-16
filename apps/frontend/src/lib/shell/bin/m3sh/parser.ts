export type CommandLine = string[]
export type ParseResult = CommandLine[]

export class ParseError extends Error {
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
    this.name = 'ParseError'
  }
}

export function parseText(text: string): ParseResult {
  return new Parser(text).run()
}

class Parser {
  //#region public
  constructor(source: string) {
    this.source = source
    this.pos = 0
    this.lines = []
  }

  run(): ParseResult {
    while (!this.halted()) {
      this.lines.push(this.parseLine())
    }
    return this.lines
  }
  //#endregion

  //#region private
  private static readonly WORD_TERMINATORS = new Set([' ', '\t', '\n', ';', '"', "'"])

  private readonly source: string
  private readonly lines: ParseResult
  private pos: number

  private peek() {
    return this.peekAt(0)
  }

  private peekAt(offset: number) {
    return this.source[this.pos + offset]
  }

  private bump() {
    return this.source[this.pos++]
  }

  private halted() {
    return this.pos >= this.source.length
  }

  // Builds a ParseError, computing line/column/lineText from an absolute offset.
  private error(message: string, pos: number = this.pos): ParseError {
    let line = 0
    let lineStart = 0
    for (let i = 0; i < pos && i < this.source.length; i++) {
      if (this.source[i] === '\n') {
        line++
        lineStart = i + 1
      }
    }
    const newline = this.source.indexOf('\n', lineStart)
    const lineEnd = newline === -1 ? this.source.length : newline
    const lineText = this.source.slice(lineStart, lineEnd)
    return new ParseError(message, pos, line, pos - lineStart, lineText)
  }

  private parseLine(): CommandLine {
    const words: string[] = []

    while (!this.halted()) {
      this.skipTrivia()
      if (this.halted()) return words
      if (this.peek() === '\n' || this.peek() === ';') {
        this.bump()
        return words
      }
      words.push(this.parseWord())
    }

    return words
  }

  private parseWord(): string {
    const char = this.peek()
    return char === '"' || char === "'" ? this.parseQuotedWord() : this.parseBareWord()
  }

  private parseQuotedWord(): string {
    const quote = this.bump()
    let word = ''

    for (;;) {
      if (this.halted()) throw this.error('unterminated quoted string')

      const char = this.peekAt(0)
      if (char === '\\') {
        word += this.parseEscape()
        continue
      }

      this.bump()
      if (char === quote) break
      word += char
    }

    return word
  }

  private parseBareWord(): string {
    let word = ''

    while (!this.halted()) {
      const char = this.peek()
      if (Parser.WORD_TERMINATORS.has(char)) break

      if (char === '\\') {
        word += this.parseEscape()
        continue
      }

      word += this.bump()
    }

    return word
  }

  // Reads the character after a '\' (already consumed) and returns its value.
  private parseEscape(): string {
    this.bump()
    if (this.halted()) throw this.error('unterminated escape sequence')

    const nextChar = this.bump()
    switch (nextChar) {
      case '"':
      case "'":
      case '\\':
        return nextChar
      case 'n':
        return '\n'
      case 't':
        return '\t'
      case ' ':
        return ' '
      default:
        throw this.error(`invalid escape sequence \\${nextChar}`, this.pos - 1)
    }
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
        case '/': {
          const nextChar = this.peekAt(1)
          switch (nextChar) {
            // Skips single-line comments
            case '/': {
              this.pos += 2

              this.skipLine()
              break
            }

            // Skips multi-line comments
            case '*': {
              this.skipMultiLineComment()
              break
            }

            // Not trivia
            default: {
              return
            }
          }
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

  private skipMultiLineComment() {
    this.pos += 2

    while (!this.halted()) {
      if (this.bump() === '*' && this.peek() === '/') {
        this.bump()
        break
      }
    }
  }
  //#endregion
}
