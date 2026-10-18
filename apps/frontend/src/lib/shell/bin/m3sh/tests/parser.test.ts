import { describe, expect, it, test } from 'vitest'
import { ASTPipeline } from '../ast'
import { Lexer } from '../lexer'
import { Parser } from '../parser'

// TODO: isolate from lexer
function parse(text: string): ASTPipeline[] {
  const parser = new Parser(new Lexer(text))
  return parser.parseProgram()
}

describe(Parser, () => {
  test('a=1 b=x=y cmd x', () => {
    const text = 'a=1 b=x=y cmd x'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map([
              ['a', '1'],
              ['b', 'x=y'],
            ]),
            argv: ['cmd', 'x'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('a | b=1 c | d', () => {
    const text = 'a | b=1 c | d'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map(),
            argv: ['a'],
          },
          {
            type: 'command',
            env: new Map([['b', '1']]),
            argv: ['c'],
          },
          {
            type: 'command',
            env: new Map(),
            argv: ['d'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('blank lines and comments between commands', () => {
    const text = '\necho a # c\n\necho b\n'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map(),
            argv: ['echo', 'a'],
          },
        ],
      },
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map(),
            argv: ['echo', 'b'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('echo a=b', () => {
    const text = 'echo a=b'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map(),
            argv: ['echo', 'a=b'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('"a"=b cmd', () => {
    const text = '"a"=b cmd'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map(),
            argv: ['a=b', 'cmd'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('a="b c" cmd', () => {
    const text = 'a="b c" cmd'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map([['a', 'b c']]),
            argv: ['cmd'],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  test('a=1', () => {
    const text = 'a=1'

    const expected: ASTPipeline[] = [
      {
        type: 'pipeline',
        commands: [
          {
            type: 'command',
            env: new Map([['a', '1']]),
            argv: [],
          },
        ],
      },
    ]

    expect(parse(text)).toEqual(expected)
  })

  it('fails with a missing command after |', () => {
    const text = 'a |'

    expect(() => {
      parse(text)
    }).toThrow(expect.objectContaining({ name: 'ParseError', pos: 3 }))
  })

  it('fails with | at the start of a pipeline', () => {
    const text = '| a'

    expect(() => {
      parse(text)
    }).toThrow(expect.objectContaining({ name: 'ParseError', pos: 0 }))
  })

  it('fails with two | in a row', () => {
    const text = 'a | | b'

    expect(() => {
      parse(text)
    }).toThrow(expect.objectContaining({ name: 'ParseError', pos: 4 }))
  })
})
