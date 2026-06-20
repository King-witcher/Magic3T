import { Channel } from '../channel'
import { Observer } from '../observable'
import { Cmd, CmdCtxConsole, DEFAULT_CMDS } from './command'
import { CVar, cvars } from './cvar'
import { ExposedEmitter } from './exposed-emitter'
import { parseLines } from './parser'

const BUFFER_SIZE = 128

interface ConsoleEventsMap {
  changeBuffer: () => void
}

export type CommandHandler = (args: string[]) => void | Promise<void>

// We use static members for commands and cvars because we need the console to be globally available, so that the http client can get it's auth tokens from the console and the console can use the http client.
export class Console {
  public static lines: string[] = []
  private static cmdsMap: Map<string, Cmd>

  // private static cmds: Record<string, CommandHandler> = { ...initialCmds }
  private static queue: Channel<() => void | Promise<void>> = new Channel()
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
          Console.log(e instanceof Error ? e.message : String(e))
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

  public static async exec(text: string) {
    if (!text) return

    await Console.queue.send(async () => {
      const lines = parseLines(text)
      for (const words of lines) {
        if (words.length === 0) continue

        const [command, ...args] = words

        const commandObj = Console.cmdsMap.get(Console.slug(command))

        // If the command does not exist, check if it's a cvar
        if (!commandObj) {
          const cvar = Console.getCvarSafe(command)
          if (!cvar) {
            Console.log(`Unknown command '${command}'`)
            return
          }

          if (args.length > 0) {
            try {
              cvars.set(command, args[0])
            } catch (e) {
              Console.log(e instanceof Error ? e.message : String(e))
            }
          } else {
            Console.inspectCvar(cvar)
          }
          continue
        }
        try {
          await commandObj.handler({
            args,
            console: Console.context,
          })
        } catch (e) {
          Console.log(e instanceof Error ? e.message : String(e))
        }
      }
    })

    // if (!cmdName) return
    // const command = Console.cmdsMap.get(Console.slug(cmdName))

    // await Console.queue.send(async () => {
    //   // If the command is not a registered command, check if it's a cvar
    //   if (!command) {
    //     const cvar = Console.getCvarSafe(cmdName)
    //     if (!cvar) {
    //       Console.log(`Unknown command '${cmdName}'`)
    //       return Err(`Unknown command '${cmdName}'`)
    //     }

    //     if (args.length > 0) {
    //       try {
    //         cvars.set(cmdName, args[0])
    //       } catch (e) {
    //         Console.log(e instanceof Error ? e.message : String(e))
    //       }
    //     } else {
    //       Console.inspectCvar(cvar)
    //     }

    //     return Ok([])
    //   }

    //   // If the command is a registered command, execute it
    //   const _result = await command.handler({
    //     args,
    //     console: Console.context,
    //   })

    //   return Ok([])
    // })
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
}
