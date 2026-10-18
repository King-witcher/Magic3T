import { Program } from '../../defs/program'

export const M3Sh: Program = {
  name: 'm3sh',
  run: async (ctx, system) => {
    const line = await ctx.stdin.getReader()
  },
}
