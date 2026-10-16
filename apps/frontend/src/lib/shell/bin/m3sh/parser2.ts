import { ASTCommand, ASTConnection, ASTLine, ASTProgram } from './ast'

// program     : program '\n' line
//             | line
//
// line        : line ';' conditional
//             | line '&' conditional
//             | conditional
//
// conditional : conditional '&&' pipeline
//             | conditional '||' pipeline
//             | pipeline
//
// pipeline    : pipeline '|' command
//             | command
//
// command     : envs cmd_base args
//             | cmd_base args
//             | envs cmd_base
//             | cmd_base
//
// envs        : envs env
//             | env
//
// env         : name '=' value

class ParserState {
  private pos = 0
  constructor(private readonly text: string) {}

  parseProgram(): ASTProgram {
    const program: ASTProgram = []
    while (!this.halted()) {
      this.skipTrivia()
      if (this.halted()) break
      program.push(this.parseLine())
    }
    return program
  }

  parseLine(): ASTLine {
    let current = this.parseConditional()
    while (!this.halted()) {
      switch (this.peek()) {
        case '\n':
          break

        case ';': {
          this.bump()
          const second = this.parseConditional()

          current = {
            type: ';',
            first: current,
            second,
          }
          break
        }
        case '&': {
          this.bump()
          const second = this.parseConditional()

          current = {
            type: '&',
            first: current,
            second,
          }
          break
        }
        default: {
          break
        }
      }
    }
    return current
  }

  parseConditional(): ASTConnection {
    let current = this.parsePipeline()
    while (!this.halted()) {
      switch (this.peek()) {
        case '\n':
        case ';':
          break

        case '&': {
          if (this.peekAt(1) === '&') break
        }

        case ';': {
          this.bump()
          const second = this.parseConditional()

          current = {
            type: ';',
            first: current,
            second,
          }
          break
        }
        case '&': {
          this.bump()
          const second = this.parseConditional()

          current = {
            type: '&',
            first: current,
            second,
          }
          break
        }
        default: {
          break
        }
      }
    }
    return current
  }

  parsePipeline(): ASTConnection {
    throw new Error('not implemented')
  }

  parseCommand(): ASTCommand {
    throw new Error('not implemented')
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

  private halted() {
    return this.pos >= this.text.length
  }

  private skipLine() {
    while (!this.halted() && this.peek() !== '\n') {
      this.bump()
    }
  }

  private skipTrivia() {
    while (!this.halted()) {
      switch (this.peek()) {
        // Skips whitespace
        case ' ':
        case '\n':
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
}
