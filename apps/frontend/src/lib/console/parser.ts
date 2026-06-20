export type CommandLine = string[]
export type ParseResult = CommandLine[]

export function parseLines(line: string): string[][] {
  return new Parser(line).run()
}

class Parser {
  source: string
  pos: number
  lines: string[][]

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

  parseLine(): string[] {
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

  parseWord(): string {
    let word = ''
    const maybeQuote = this.peek()
    // Parses quoted words
    if (maybeQuote === '"' || maybeQuote === "'") {
      this.bump()
      for (;;) {
        if (this.halted()) throw new Error('unterminated quoted string')

        const char = this.bump()
        if (char === maybeQuote) break

        // Parses escaped characters
        if (char === '\\') {
          if (this.halted()) throw new Error('unterminated quoted string')
          const nextChar = this.bump()
          switch (nextChar) {
            case '"':
            case "'":
            case '\\':
              word += nextChar
              continue

            case 'n':
              word += '\n'
              continue

            case 't':
              word += '\t'
              continue

            default:
              throw new Error(`invalid escape sequence \\${nextChar}`)
          }
        }

        word += char
      }
      return word
    }

    // Parses unquoted words
    while (!this.halted()) {
      const char = this.peek()
      if (
        char === ' ' ||
        char === '\t' ||
        char === '\n' ||
        char === ';' ||
        char === '"' ||
        char === "'"
      )
        break
      if (char === '\\') {
        this.bump()
        if (this.halted()) throw new Error('unterminated escape sequence')

        const nextChar = this.bump()
        switch (nextChar) {
          case '"':
          case "'":
          case '\\':
            word += nextChar
            break
          case 'n':
            word += '\n'
            break
          case 't':
            word += '\t'
            break
          default:
            throw new Error(`invalid escape sequence \\${nextChar}`)
        }
        continue
      }
      word += this.bump()
    }

    return word
  }

  peek() {
    return this.source[this.pos]
  }

  peekAt(offset: number) {
    return this.source[this.pos + offset]
  }

  bump() {
    return this.source[this.pos++]
  }

  halted() {
    return this.pos >= this.source.length
  }

  skipTrivia() {
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

  skipLine() {
    while (!this.halted() && this.peek() !== '\n') {
      this.bump()
    }
  }

  skipMultiLineComment() {
    this.pos += 2

    while (!this.halted()) {
      if (this.bump() === '*' && this.peek() === '/') {
        this.bump()
        break
      }
    }
  }
}
