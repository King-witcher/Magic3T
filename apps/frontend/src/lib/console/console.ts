import { Channel } from '../channel'
import { Observer } from '../observable'
import { Cmd, CmdCtxConsole, DEFAULT_CMDS } from './command'
import { CVar, cvars } from './cvar'
import { ExposedEmitter } from './exposed-emitter'

const BUFFER_SIZE = 128

interface ConsoleEventsMap {
  changeBuffer: () => void
}

export type CommandHandler = (args: string) => void | Promise<void>

export type ConsoleResult<T> = Result<T, string>

type Operation = () => ConsoleResult<[]> | Promise<ConsoleResult<[]>>

// We use static members for commands and cvars because we need the console to be globally available, so that the http client can get it's auth tokens from the console and the console can use the http client.
export class Console {
  public static lines: string[] = []
  private static cmdsMap: Map<string, Cmd>

  // private static cmds: Record<string, CommandHandler> = { ...initialCmds }
  private static queue: Channel<Operation> = new Channel()
  private static emitter = new ExposedEmitter()

  private static context: CmdCtxConsole = {
    print: Console.log,
    clear: Console.clear,
    execCmd: () => Promise.reject('Not implemented'),
    listCmds: () => Array.from(Console.cmdsMap.values()),
  }

  static {
    // Populate cmdsMap
    Console.cmdsMap = new Map(DEFAULT_CMDS.map((cmd) => [cmd.name, cmd]))

    // Command ingestor loop
    async function operationLoop() {
      for (;;) {
        const operation = await Console.queue.receive()
        try {
          const _result = await operation()
        } catch (e) {
          console.error(e)
        }
      }
    }

    operationLoop()
  }

  public static log(message?: string) {
    console.log(message)
    Console.lines = [...Console.lines, message ?? '']
    if (Console.lines.length > BUFFER_SIZE) Console.lines.shift()
    Console.emitter.publicEmit('changeBuffer')
  }

  public static clear() {
    Console.lines = []
    Console.emitter.publicEmit('changeBuffer')
  }

  public static async exec(line: string) {
    const { cmd: cmdName, args } = Console.parse(line)
    if (!cmdName) return
    const command = Console.cmdsMap.get(Console.slug(cmdName))

    await Console.queue.send(async () => {
      // If the command is not a registered command, check if it's a cvar
      if (!command) {
        const cvar = Console.getCvarSafe(cmdName)
        if (!cvar) {
          Console.log(`Unknown command '${cmdName}'`)
          return Err(`Unknown command '${cmdName}'`)
        }

        if (args.length > 0) {
          try {
            cvars.set(cmdName, args[0])
          } catch (e) {
            Console.log(e instanceof Error ? e.message : String(e))
          }
        } else {
          Console.inspectCvar(cvar)
        }

        return Ok([])
      }

      // If the command is a registered command, execute it
      const _result = await command.handler({
        args,
        console: Console.context,
      })

      return Ok([])
    })
  }

  public static addCommand(cmd: Cmd): () => void {
    const prev = Console.cmdsMap.get(cmd.name)

    Console.cmdsMap.set(Console.slug(cmd.name), cmd)
    return () => {
      if (prev) Console.cmdsMap.set(Console.slug(prev.name), prev)
      else Console.cmdsMap.delete(Console.slug(cmd.name))
    }
  }

  public static on<Event extends keyof ConsoleEventsMap>(
    event: Event,
    observer: Observer<ConsoleEventsMap, Event>
  ): () => void {
    return Console.emitter.on(event, observer)
  }

  public static onMany<Event extends keyof ConsoleEventsMap>(
    events: Event[],
    observer: Observer<ConsoleEventsMap, Event>
  ): () => void {
    return Console.emitter.onMany(events, observer)
  }

  private static inspectCvar(cvar: CVar) {
    const str = `${cvar.id} = ${JSON.stringify(cvar.value)} (default: ${JSON.stringify(cvar.default)})`
    Console.log(str)
    Console.log(cvar.description)
  }

  private static slug(name: string): string {
    return name.toLowerCase()
  }

  /** Looks up a cvar, returning null instead of throwing for invalid ids. */
  private static getCvarSafe(id: string): Readonly<CVar> | null {
    try {
      return cvars.getCvar(id)
    } catch {
      return null
    }
  }

  private static parse(line: string): { cmd: string; args: string[] } {
    const args: string[] = []
    let doubleQuotes = false
    let singleQuotes = false
    let escaping = false
    let currentArg = ''

    function push() {
      if (currentArg.length > 0) {
        args.push(currentArg)
        currentArg = ''
      }
    }

    for (const char of line) {
      if (escaping) {
        currentArg += char
        escaping = false
        continue
      }

      if (char === '\\') {
        escaping = true
        continue
      }

      if (singleQuotes) {
        if (char === "'") {
          args.push(currentArg)
          currentArg = ''
          singleQuotes = false
          continue
        }
        currentArg += char
        continue
      }

      if (doubleQuotes) {
        if (char === '"') {
          args.push(currentArg)
          currentArg = ''
          doubleQuotes = false
          continue
        }
        currentArg += char
        continue
      }

      if (char === '"') {
        push()
        doubleQuotes = true
        continue
      }

      if (char === "'") {
        push()
        singleQuotes = true
        continue
      }

      if (char === ' ') {
        push()
        continue
      }

      currentArg += char
    }
    push()

    return {
      cmd: args.shift() ?? '',
      args,
    }
  }
}
