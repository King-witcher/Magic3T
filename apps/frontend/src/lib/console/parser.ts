export type CommandLine = string[]
export type ParseResult = CommandLine[]

export class ParseError extends Error {
  constructor(
    message: string,
    readonly pos: number,
  ) {
    super(message)
    this.name = 'ParseError'
  }
}

export function parseLines(line: string): ParseResult {
  return new Parser(line).run()
}

class Parser {
  private static readonly WORD_TERMINATORS = new Set([
    ' ',
    '\t',
    '\n',
    ';',
    '"',
    "'",
  ])

  private readonly source: string
  private readonly lines: ParseResult
  private pos: number

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
    return char === '"' || char === "'"
      ? this.parseQuotedWord()
      : this.parseBareWord()
  }

  private parseQuotedWord(): string {
    const quote = this.bump()
    let word = ''

    for (;;) {
      if (this.halted()) throw new ParseError('unterminated quoted string', this.pos)

      const char = this.bump()
      if (char === quote) break

      if (char === '\\') {
        word += this.parseEscape()
        continue
      }

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
        this.bump()
        word += this.parseEscape()
        continue
      }

      word += this.bump()
    }

    return word
  }

  // Reads the character after a '\' (already consumed) and returns its value.
  private parseEscape(): string {
    if (this.halted()) throw new ParseError('unterminated escape sequence', this.pos)

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
      default:
        throw new ParseError(`invalid escape sequence \\${nextChar}`, this.pos - 1)
    }
  }

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
}
