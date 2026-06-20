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
    const args: string[] = []

    while (!this.halted()) {
      this.skipTrivia()
      if (this.halted()) return args
      if (this.peek() === '\n' || this.peek() === ';') {
        this.bump()
        return args
      }
      args.push(this.parseArg())
    }

    return args
  }

  parseArg(): string {
    let arg = ''
    const maybeQuote = this.peek()
    // Parses quoted args
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
              arg += nextChar
              continue

            case 'n':
              arg += '\n'
              continue

            case 't':
              arg += '\t'
              continue

            default:
              throw new Error(`invalid escape sequence \\${nextChar}`)
          }
        }

        arg += char
      }
      return arg
    }

    // Parses unquoted args
    while (!this.halted()) {
      const char = this.peek()
      if (char === ' ' || char === '\t' || char === '\n' || char === ';') break
      if (char === '\\') {
        this.bump()
        if (this.halted()) throw new Error('unterminated escape sequence')

        const nextChar = this.bump()
        switch (nextChar) {
          case '"':
          case "'":
          case '\\':
            arg += nextChar
            break
          case 'n':
            arg += '\n'
            break
          case 't':
            arg += '\t'
            break
          default:
            throw new Error(`invalid escape sequence \\${nextChar}`)
        }
        continue
      }
      arg += this.bump()
    }

    return arg
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

              while (!this.halted() && this.peek() !== '\n') this.bump()
              break
            }

            // Skips multi-line comments
            case '*': {
              this.pos += 2

              while (!this.halted()) {
                if (this.bump() === '*' && this.peek() === '/') {
                  this.bump()
                  break
                }
              }
            }
          }
          break
        }
        default:
          return
      }
    }
  }
}
