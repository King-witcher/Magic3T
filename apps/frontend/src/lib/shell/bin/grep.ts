import { Program } from '../defs/program'
import { lineSplitter } from '../defs/streams'

export const Grep: Program = {
  name: 'grep',
  run: async ({ stdin, stdout, stderr, signal, args }) => {
    const out = stdout.getWriter()
    const err = stderr.getWriter()

    try {
      const pattern = args.join(' ')
      if (!pattern) {
        await err.write('usage: grep PATTERN\n')
        return 2
      }

      const reader = stdin.pipeThrough(lineSplitter(), { signal }).getReader()
      let matched = false

      while (true) {
        const { done, value: line } = await reader.read()
        if (done) break
        if (line.includes(pattern)) {
          matched = true
          await out.write(`${line}\n`)
        }
      }

      return matched ? 0 : 1
    } finally {
      // Close on every exit path so downstream sees EOF; allSettled keeps a close failure from masking the original error
      await Promise.allSettled([out.close(), err.close()])
    }
  },
}
