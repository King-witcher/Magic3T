import { io } from 'socket.io-client'
import { apiClient } from '@/services/clients/api-client'
import { cvars, SystemCvarId } from './cvar'

export type CmdCtxConsole = Readonly<{
  print: (message: string) => void
  clear: () => void
  listCmds: () => Cmd[]
  execCmd: (line: string, ctx?: CmdCtx) => Promise<void>
}>

export type CmdCtx = {
  args: string[]
  console: CmdCtxConsole
}

export type Cmd = {
  name: string
  description: string
  handler: (ctx: CmdCtx) => Promise<number>
}

export const DEFAULT_CMDS: Cmd[] = [
  {
    name: '3tmode',
    description: 'Enables magic square number arrangement',
    async handler({ console }: CmdCtx) {
      const enabled = cvars.getBool(SystemCvarId.Ui3TMode)
      cvars.set(SystemCvarId.Ui3TMode, enabled ? '0' : '1')
      console.print(`3tmode ${enabled ? 'OFF' : 'ON'}`)
      return 0
    },
  },
  {
    name: 'clear',
    description: 'Clears the console buffer',
    async handler({ console }: CmdCtx) {
      console.clear()
      return 0
    },
  },
  {
    name: 'cmdlist',
    description: 'Lists all available commands',
    async handler({ console }: CmdCtx) {
      const cmds = console.listCmds().sort((a, b) => a.name.localeCompare(b.name))

      for (const cmd of cmds) {
        let line = cmd.name
        line += ' '.repeat(Math.max(0, 20 - line.length))
        line += `// ${cmd.description}`
        console.print(line)
      }
      console.print(`Listed ${cmds.length} commands`)
      return 0
    },
  },
  {
    name: 'cvarlist',
    description: 'Lists all available cvars',
    async handler({ console }: CmdCtx) {
      const list = cvars.list().sort((a, b) => a.id.localeCompare(b.id))

      for (const cvar of list) {
        let line = cvar.id
        line += ' '.repeat(Math.max(0, 20 - line.length))
        line += '= '
        line += JSON.stringify(cvar.value)
        line += ' '.repeat(Math.max(0, 60 - line.length))
        line += `// ${cvar.description ?? 'No description'}`
        console.print(line)
      }
      console.print(`Listed ${list.length} cvars`)
      return 0
    },
  },
  {
    name: 'delay',
    description: 'Delays execution for a specified number of milliseconds',
    async handler({ args, console }: CmdCtx) {
      const ms = Number(args[0])
      if (Number.isNaN(ms) || ms < 0) {
        console.print('Usage: delay <ms>')
        return 1
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(0)
        }, ms)
      })
    },
  },
  {
    name: 'echo',
    description: 'Prints the provided arguments to the console',
    async handler({ args, console }: CmdCtx) {
      console.print(args.join(' '))
      return 0
    },
  },
  {
    name: 'resetcvars',
    description: 'Resets all cvars to their default values',
    async handler({ console }: CmdCtx) {
      for (const cvar of cvars.list()) {
        if (cvar.readonly) continue
        cvars.set(cvar.id, String(cvar.default))
      }
      console.print('All cvars have been reset to their default values')
      return 0
    },
  },
  {
    name: 'ping',
    description: 'Pings the server and returns the latency',
    async handler({ console }: CmdCtx) {
      const http = await pingHttp()
      console.print(`HTTP: ${http}ms`)
      const url = cvars.get(SystemCvarId.SvApiUrl) as string
      const ws = await pingWs(url)
      console.print(`WS: ${ws}ms`)
      return 0
    },
  },
  {
    name: 'set',
    description: 'Sets the value of a cvar',
    async handler({ args, console }: CmdCtx) {
      const cvarName = args[0]
      const value = args[1]
      if (!cvarName || !value) {
        console.print('Usage: set <cvar> <value>')
        return 1
      }
      try {
        cvars.set(cvarName, value)
      } catch (e) {
        console.print(e instanceof Error ? e.message : String(e))
        return 1
      }
      return 0
    },
  },
]

async function pingHttp(): Promise<number> {
  const now = Date.now()
  await apiClient.getStatus()
  return Date.now() - now
}

async function pingWs(url: string): Promise<number> {
  // TODO: user um promise with resolvers aqui
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: preguiça, proojeto é meu mesmo
  return new Promise(async (resolve, reject) => {
    const socket = io(url, {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      const timeout = setTimeout(() => {
        socket.disconnect()
        reject('WS ping timed out')
      }, 5000)

      const rng = Math.floor(Math.random() * 1000000)

      socket.on('pong', (arg: unknown) => {
        if (arg !== rng) return
        const elapsed = Date.now() - now
        socket.disconnect()
        clearTimeout(timeout)
        resolve(elapsed)
      })

      const now = Date.now()
      socket.emit('ping', rng)
    })
  })
}
