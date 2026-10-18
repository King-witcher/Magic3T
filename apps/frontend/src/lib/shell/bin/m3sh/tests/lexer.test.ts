import { describe, expect, it, test } from 'vitest'
import { Lexer } from '../lexer'
import { Token } from '../token'

function lexAll(text: string): Token[] {
  const lexer = new Lexer(text)
  return lexer.lexAll()
}

describe(Lexer, () => {
  test('command arg1 arg2', () => {
    const text = 'command arg1 arg2'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: false,
        pos: 0,
        value: 'command',
      },
      {
        kind: 'word',
        assign: false,
        pos: 8,
        value: 'arg1',
      },
      {
        kind: 'word',
        assign: false,
        pos: 13,
        value: 'arg2',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('__command arg1 arg2', () => {
    const text = '  command arg1 arg2'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: false,
        pos: 2,
        value: 'command',
      },
      {
        kind: 'word',
        assign: false,
        pos: 10,
        value: 'arg1',
      },
      {
        kind: 'word',
        assign: false,
        pos: 15,
        value: 'arg2',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('command | piped', () => {
    const text = 'command | piped'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: false,
        pos: 0,
        value: 'command',
      },
      {
        kind: '|',
        pos: 8,
      },
      {
        kind: 'word',
        assign: false,
        pos: 10,
        value: 'piped',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('var="value" command', () => {
    const text = 'var="value" command'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: true,
        pos: 0,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: false,
        pos: 12,
        value: 'command',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('var=value command', () => {
    const text = 'var=value command'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: true,
        pos: 0,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: false,
        pos: 10,
        value: 'command',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('var=value  var2=value2 command', () => {
    const text = 'var=value  var2=value2 command'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: true,
        pos: 0,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: true,
        pos: 11,
        value: 'var2=value2',
      },
      {
        kind: 'word',
        assign: false,
        pos: 23,
        value: 'command',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('var=value command1 | var=value command2', () => {
    const text = 'var=value command1 | var=value command2'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: true,
        pos: 0,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: false,
        pos: 10,
        value: 'command1',
      },
      {
        kind: '|',
        pos: 19,
      },
      {
        kind: 'word',
        assign: true,
        pos: 21,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: false,
        pos: 31,
        value: 'command2',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  test('"var"=value var2=value2 command', () => {
    const text = '"var"=value  var2=value2 command'

    const expected: Token[] = [
      {
        kind: 'word',
        assign: false,
        pos: 0,
        value: 'var=value',
      },
      {
        kind: 'word',
        assign: true,
        pos: 13,
        value: 'var2=value2',
      },
      {
        kind: 'word',
        assign: false,
        pos: 25,
        value: 'command',
      },
      {
        kind: 'eof',
        pos: text.length,
      },
    ]

    expect(lexAll(text)).toEqual(expected)
  })

  describe('getLine', () => {
    test('returns the correct line', () => {
      const lexer = new Lexer('1234\n1234\n1234\n1234\n1234')
      lexer.lexAll()

      for (let line = 1; line <= 5; line++) {
        const offset = (line - 1) * 5
        for (let i = 0; i < 5; i++)
          expect(lexer.getLine(offset + i), `char ${offset} is at line ${line}`).toBe(line)
      }
    })
  })

  it('fails with unterminated quotes', () => {
    const text = 'unterminated "'

    expect(() => {
      lexAll(text)
    }).toThrow('unterminated quotes')
  })

  it('fails with unterminated escape', () => {
    const text = 'unterminated \\'

    expect(() => {
      lexAll(text)
    }).toThrow('unterminated escape sequence')
  })

  it('fails with invalid escape', () => {
    const text = 'invalid \\a'

    expect(() => {
      lexAll(text)
    }).toThrow('invalid escape sequence: \\a')
  })
})
