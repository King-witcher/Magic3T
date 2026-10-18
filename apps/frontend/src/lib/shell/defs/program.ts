import { CVar } from '../oldlib/cvar'

export type SpawnOptions = {
  stdin?: ReadableStream
  stdout?: WritableStream
  stderr?: WritableStream
  signal?: AbortSignal
}

export type Process = {
  pid: number
  exitCode: Promise<number>
}

export type System = {
  spawn: (process: string, args?: string[], opts?: SpawnOptions) => Process
  getcvar: (key: string) => CVar | null
}

export type ProcessCtx = {
  pid: number
  env: Map<string, string>
  args: string[]
  stdin: ReadableStream<string>
  stdout: WritableStream<string>
  stderr: WritableStream<string>
  signal: AbortSignal
}

export type Program = {
  name: string
  description?: string
  run: (proc: ProcessCtx, system: System) => Promise<number | undefined>
}
