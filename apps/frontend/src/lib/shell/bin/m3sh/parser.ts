import { ASTCommand, ASTPipeline } from './ast'
import { ILexer } from './lexer'
import { Token } from './token'

export class Parser {
  private tok: Token

  constructor(private lexer: ILexer) {
    this.tok = lexer.next()
  }

  parseProgram(): ASTPipeline[] {
    const pipelines: ASTPipeline[] = []
    while (!this.halted()) {
      if (this.peek().kind === '\n') {
        this.bump()
        continue
      }
      if (this.peek().kind === 'word') {
        pipelines.push(this.parsePipeline())
        continue
      }

      throw this.error('unexpected token')
    }
    return pipelines
  }

  private parsePipeline(): ASTPipeline {
    const pipeline: ASTPipeline = {
      type: 'pipeline',
      commands: [this.parseCommand()],
    }

    while (!this.halted() && this.peek().kind !== '\n') {
      switch (this.peek().kind) {
        case '|': {
          this.bump()
          if (this.peek().kind !== 'word') throw this.error('unexpected token')
          pipeline.commands.push(this.parseCommand())
          break
        }
        default: {
          throw this.error('unexpected token')
        }
      }
    }

    return pipeline
  }

  private parseCommand(): ASTCommand {
    const command: ASTCommand = {
      type: 'command',
      argv: [],
      env: new Map(),
    }

    let tok = this.peek()
    while (tok.kind === 'word' && tok.assign) {
      this.bump()

      const eq = tok.value.indexOf('=')
      command.env.set(tok.value.slice(0, eq), tok.value.slice(eq + 1))

      tok = this.peek()
    }

    while (tok.kind === 'word') {
      this.bump()
      command.argv.push(tok.value)
      tok = this.peek()
    }

    return command
  }

  private peek(): Token {
    return this.tok
  }

  private bump(): Token {
    const token = this.tok
    this.tok = this.lexer.next()
    return token
  }

  private halted(): boolean {
    return this.tok.kind === 'eof'
  }

  private error(message: string, pos?: number): ParseError {
    const line = this.lexer.getLine(pos ?? this.tok.pos)
    return new ParseError(message, pos ?? this.tok.pos, line, 0, '')
  }
}

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
