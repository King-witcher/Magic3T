export type SpawnOptions = {
  stdin?: ReadableStream
  stdout?: WritableStream
  sig?: AbortSignal
}

export type Process = {
  pid: number
  exitCode: Promise<number>
  kill: (reason?: string) => void
}

export type ProgramCtx = {
  pid: number
  env: Map<string, string>
  args: string[]
  stdin: ReadableStream
  stdout: WritableStream
  sig: AbortSignal
  spawn: (process: string, args?: [], opts?: SpawnOptions) => Process
}

export type Program = {
  name: string
  description?: string
  run: (ctx: ProgramCtx) => Promise<number>
}
