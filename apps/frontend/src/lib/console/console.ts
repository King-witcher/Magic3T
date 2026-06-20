import { Channel } from '../channel'
import { Observer } from '../observable'
import { Cmd, CmdCtxConsole, DEFAULT_CMDS } from './command'
import { CVar, cvars } from './cvar'
import { ExposedEmitter } from './exposed-emitter'
import { ParseError, parseLines } from './parser'

const BUFFER_SIZE = 128

interface ConsoleEventsMap {
  changeBuffer: () => void
}

export type CommandHandler = (args: string[]) => void | Promise<void>

// Exported as a singleton instance (see `Console` below) rather than a static
// class: the console must be globally reachable — the http client reads its auth
// tokens from here and this reaches the http client — but staying a normal,
// instantiable class keeps it resettable in tests and free of import-time
// global state.
class ConsoleClass {
  //#region public
  constructor() {
    this.cmds = new Map(DEFAULT_CMDS.map((cmd) => [this.slug(cmd.name), cmd]))
    this.runLoop()
  }

  get lines(): readonly string[] {
    return this.buffer
  }

  log(message?: string) {
    console.log(message)
    const next = [...this.buffer, message ?? '']
    if (next.length > BUFFER_SIZE) next.shift()
    this.buffer = next
    this.emitter.publicEmit('changeBuffer')
  }

  clear() {
    this.buffer = []
    this.emitter.publicEmit('changeBuffer')
  }

  /** Enqueues a script (one or more `;`/newline separated commands) for execution. */
  async exec(text: string) {
    if (!text) return
    await this.queue.send(() => this.execLines(text))
  }

  addCommand(cmd: Cmd): () => void {
    const key = this.slug(cmd.name)
    const prev = this.cmds.get(key)

    this.cmds.set(key, cmd)
    return () => {
      if (prev) this.cmds.set(key, prev)
      else this.cmds.delete(key)
    }
  }

  on<Event extends keyof ConsoleEventsMap>(
    event: Event,
    observer: Observer<ConsoleEventsMap, Event>
  ): () => void {
    return this.emitter.on(event, observer)
  }

  onMany<Event extends keyof ConsoleEventsMap>(
    events: Event[],
    observer: Observer<ConsoleEventsMap, Event>
  ): () => void {
    return this.emitter.onMany(events, observer)
  }
  //#endregion

  //#region private
  private buffer: string[] = []
  private readonly cmds: Map<string, Cmd>
  private readonly queue = new Channel<() => Promise<unknown>>()
  private readonly emitter = new ExposedEmitter<ConsoleEventsMap>()

  private readonly context: CmdCtxConsole = {
    print: (message) => this.log(message),
    clear: () => this.clear(),
    execCmd: async (line) => {
      await this.execLines(line)
    },
    listCmds: () => Array.from(this.cmds.values()),
  }

  // Drains the command queue forever, serializing execution and surfacing errors.
  private async runLoop() {
    for (;;) {
      const operation = await this.queue.receive()
      try {
        await operation()
      } catch (e) {
        console.error(e)
        if (e instanceof ParseError) this.printParseError(e)
        else this.log(e instanceof Error ? e.message : String(e))
      }
    }
  }

  // Parses a script and runs each command, returning the last exit code. Runs
  // synchronously within the caller, so it is safe to call from a command
  // handler (via context.execCmd) without deadlocking the queue.
  private async execLines(text: string): Promise<number> {
    const lines = parseLines(text)
    let code = 0
    for (const words of lines) {
      if (words.length === 0) continue
      code = await this.runCommandLine(words)
    }
    return code
  }

  private async runCommandLine(words: string[]): Promise<number> {
    const [name, ...args] = words
    try {
      const cmd = this.cmds.get(this.slug(name))
      if (cmd) return await cmd.handler({ args, console: this.context })
      return this.runCvar(name, args)
    } catch (e) {
      this.log(e instanceof Error ? e.message : String(e))
      return 1
    }
  }

  // Fallback for tokens that aren't commands: treat the token as a cvar, setting
  // it when a value follows, otherwise inspecting it.
  private runCvar(name: string, args: string[]): number {
    const cvar = this.getCvarSafe(name)
    if (!cvar) {
      this.log(`Unknown command '${name}'`)
      return 1
    }
    if (args.length > 0) {
      cvars.set(name, args[0])
      return 0
    }
    this.inspectCvar(cvar)
    return 0
  }

  private printParseError(e: ParseError) {
    this.log(e.lineText)
    this.log(`${' '.repeat(e.column)}^`)
    this.log(`Parse error (line ${e.line + 1}, col ${e.column + 1}): ${e.message}.`)
  }

  private inspectCvar(cvar: CVar) {
    this.log(
      `${cvar.id} = ${JSON.stringify(cvar.value)} (default: ${JSON.stringify(cvar.default)})`
    )
    if (cvar.description) this.log(cvar.description)
  }

  private slug(name: string): string {
    return name.toLowerCase()
  }

  /** Looks up a cvar, returning null instead of throwing for invalid ids. */
  private getCvarSafe(id: string): Readonly<CVar> | null {
    try {
      return cvars.getCvar(id)
    } catch {
      return null
    }
  }
  //#endregion
}

export const Console = new ConsoleClass()
