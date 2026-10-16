export type ASTCommand = {
  type: 'command'
  env: Record<string, string>
  command: string
  args: string[]
}

export type ASTConnection = {
  type: '|' | '&' | '||' | '&' | ';'
  first: ASTConnection | ASTCommand
  second: ASTConnection | ASTCommand
}

export type ASTLine = ASTConnection | ASTCommand

export type ASTProgram = ASTLine[]
