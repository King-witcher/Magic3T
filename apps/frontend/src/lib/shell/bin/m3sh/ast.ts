export type ASTCommand = {
  type: 'command'
  env: Map<string, string>
  argv: string[]
}

export type ASTPipeline = {
  type: 'pipeline'
  commands: ASTCommand[]
}
