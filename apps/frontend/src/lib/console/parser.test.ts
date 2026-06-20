import { describe, expect, test } from 'vitest'
import { parseLines } from './parser'

describe(parseLines, () => {
  test('parses simple command', () => {
    const result = parseLines('command arg1 arg2')
    expect(result).toEqual([['command', 'arg1', 'arg2']])
  })

  test('parses multiple commands', () => {
    const result = parseLines('command1 arg1; command2 arg2')
    expect(result).toEqual([
      ['command1', 'arg1'],
      ['command2', 'arg2'],
    ])
  })

  test('parses quoted args', () => {
    const result = parseLines('command "arg with spaces" \'another arg\'')
    expect(result).toEqual([['command', 'arg with spaces', 'another arg']])
  })

  test('parses escaped quotes', () => {
    const result = parseLines('command "arg with \\"escaped\\" quotes"')
    expect(result).toEqual([['command', 'arg with "escaped" quotes']])
  })

  test('parses newlines as command separators', () => {
    const result = parseLines('command1 arg1\ncommand2 arg2')
    expect(result).toEqual([
      ['command1', 'arg1'],
      ['command2', 'arg2'],
    ])
  })

  test('throws on unterminated quoted string', () => {
    expect(() => parseLines('command "unterminated arg')).toThrow('unterminated quoted string')
  })

  test('parses empty string as no lines', () => {
    const result = parseLines('')
    expect(result).toEqual([])
  })

  test('parses commands with leading and trailing whitespace', () => {
    const result = parseLines('  command arg1 arg2  ')
    expect(result).toEqual([['command', 'arg1', 'arg2']])
  })

  test('quotes separate words even with no spaces', () => {
    const result = parseLines('command"arg with spaces"\'another arg\'')
    expect(result).toEqual([['command', 'arg with spaces', 'another arg']])
  })

  describe('comments', () => {
    test('ignores single-line comments', () => {
      const result = parseLines('// This is a comment\ncommand arg1 arg2')
      expect(result).toEqual([[], ['command', 'arg1', 'arg2']])
    })

    test('ignores multi-line comments', () => {
      const result = parseLines('/* This is a multi-line comment */\ncommand arg1 arg2')
      expect(result).toEqual([[], ['command', 'arg1', 'arg2']])
    })

    test('ignores multiple trivia comments', () => {
      const result = parseLines(
        '/* This is a multi-line comment */ /* This is a multi-line comment */\ncommand arg1 arg2'
      )
      expect(result).toEqual([[], ['command', 'arg1', 'arg2']])
    })

    test('does not stall on words started with /', () => {
      const result = parseLines('/command /arg1 arg2')
      expect(result).toEqual([['/command', '/arg1', 'arg2']])
    })
  })
})
