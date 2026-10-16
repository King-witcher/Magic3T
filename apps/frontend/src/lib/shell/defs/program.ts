import { CVar } from '../slib/cvar'

export type SpawnOptions = {
  stdin?: ReadableStream
  stdout?: WritableStream
  stderr?: WritableStream
  sig?: AbortSignal
}

export type Process = {
  pid: number
  exitCode: Promise<number>
}

export type System = {
  spawn: (process: string, args?: string[], opts?: SpawnOptions) => Process
  getcvar: (key: string) => CVar | null
}

export type ProgramCtx = {
  pid: number
  env: Map<string, string>
  args: string[]
  stdin: ReadableStream<string>
  stdout: WritableStream<string>
  stderr: WritableStream<string>
  sig: AbortSignal
}

export type Program = {
  name: string
  description?: string
  run: (ctx: ProgramCtx, system: System) => Promise<number>
}
