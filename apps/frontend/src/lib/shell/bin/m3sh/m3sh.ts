import { Program, SpawnOptions } from '../../defs/program'
import { StreamReader } from '../../lib/stream-reader'
import { Lexer } from './lexer'
import { Parser } from './parser'

export const M3Sh: Program = {
  name: 'm3sh',
  run: async (proc, system) => {
    const stdin = new StreamReader(proc.stdin)

    for (;;) {
      if (proc.signal.aborted) return 1
      const line = await stdin.readLine()
      if (proc.signal.aborted) return 1

      if (!line?.length) break

      const lexer = new Lexer(line)
      const parser = new Parser(lexer)
      const ast = parser.parseProgram()

      for (const pipeline of ast) {
        if (!pipeline.commands.length) continue

        const opts = pipeline.commands.map(
          (cmd): SpawnOptions => ({
            signal: proc.signal,
          })
        )

        opts[0].stdin = proc.stdin
        opts[opts.length - 1].stdout = proc.stdout

        const pipes = Array.from({ length: pipeline.commands.length - 1 }).map(
          () => new TransformStream()
        )

        for (let i = 0; i < pipes.length; i++) {
          const { readable, writable } = pipes[i]
          opts[i].stdout = writable
          opts[i + 1].stdin = readable
        }

        // TODO: review this line
        const exits = await Promise.all(
          opts.map(async (opts, index) => {
            const command = pipeline.commands[index]
            const [program] = command.argv
            const args = command.argv.slice(1)
            const exit = await system.spawn(program, args, opts).exitCode
            if (index !== 0) opts.stdin?.cancel()
            if (index !== pipeline.commands.length - 1) opts.stdout?.close()
            return exit
          })
        )
      }
    }
  },
}
