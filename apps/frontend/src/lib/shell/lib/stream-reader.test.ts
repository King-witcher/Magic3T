import { describe, expect, it, test } from 'vitest'
import { StreamReader } from './stream-reader'

function mockStream(data: string[]): ReadableStream<string> {
  let i = 0
  return new ReadableStream<string>({
    pull(controller) {
      if (i < data.length) controller.enqueue(data[i++])
      else controller.close()
    },
  })
}

function mockReader(data: string[]): StreamReader {
  return new StreamReader(mockStream(data))
}

describe(StreamReader, () => {
  test('peekChar() peeks a character without moving the cursor', async () => {
    const reader = mockReader(['ab'])
    expect(await reader.peekChar()).toBe('a')
    expect(await reader.peekChar()).toBe('a')
  })

  test('peekChar() returns null when empty', async () => {
    const reader = mockReader([''])
    const reader2 = mockReader([])

    expect(await reader.peekChar()).toBe(null)
    expect(await reader2.peekChar()).toBe(null)
  })

  test('read(n) concatenates and works', async () => {
    const reader = mockReader(['ab', 'cd'])
    expect(await reader.read(4)).toBe('abcd')
  })

  test('read(0) returns empty string', async () => {
    const reader = mockReader(['abcd'])
    expect(await reader.read(0)).toBe('')
  })

  test('read(n > max) works', async () => {
    const reader = mockReader(['abc'])
    expect(await reader.read(5)).toBe('abc')
  })

  test('read(n) reads null string when empty', async () => {
    const reader = mockReader([])
    expect(await reader.read(5)).toBe(null)
  })

  test('readAll concatenate and works', async () => {
    const reader = mockReader(['ab', 'cd'])
    expect(await reader.readAll()).toBe('abcd')
  })

  it('readChar reads characters in order', async () => {
    const reader = mockReader(['abc'])

    expect(await reader.readChar()).toBe('a')
    expect(await reader.readChar()).toBe('b')
    expect(await reader.readChar()).toBe('c')
    expect(await reader.readChar()).toBe(null)
  })

  test('readChar reads null when empty', async () => {
    const reader = mockReader([])
    expect(await reader.readChar()).toBe(null)
  })

  test('readLine reads after last newLine', async () => {
    const reader = mockReader(['abc\n', 'def'])
    expect(await reader.readLine()).toBe('abc')
    expect(await reader.readLine()).toBe('def')
  })

  test('readLine ignores \\r\\n as well', async () => {
    const reader = mockReader(['ab\r\ncd'])
    const reader2 = mockReader(['ab\r', '\ncd'])

    expect(await reader.readLine()).toBe('ab')
    expect(await reader.readLine()).toBe('cd')

    expect(await reader2.readLine()).toBe('ab')
    expect(await reader2.readLine()).toBe('cd')
  })

  test('readLine concatenates until \\n', async () => {
    const reader = mockReader(['abc', 'def\nghi'])
    expect(await reader.readLine()).toBe('abcdef')
  })

  test('readLine reads empty lines', async () => {
    const reader = mockReader(['\n\n', '\n'])
    expect(await reader.readLine()).toBe('')
    expect(await reader.readLine()).toBe('')
    expect(await reader.readLine()).toBe('')
  })

  // Suggested by Claude
  test('readLine reads null after new line', async () => {
    const reader = mockReader(['abc'])
    expect(await reader.readLine()).toBe('abc')
    expect(await reader.readLine()).toBe(null)
  })

  test('ignores empty chunks', async () => {
    expect(await mockReader(['', 'abc']).readChar()).toBe('a')
    expect(await mockReader(['ab', '', 'cd']).readAll()).toBe('abcd')
    expect(await mockReader(['ab', '', 'c\n']).readLine()).toBe('abc')
  })

  test('lines() keeps empty lines', async () => {
    const lines: string[] = []
    for await (const line of mockReader(['a\n\nb'])) lines.push(line)
    expect(lines).toEqual(['a', '', 'b'])
  })

  test('release() frees the stream for another reader', async () => {
    const stream = mockStream(['abc'])
    new StreamReader(stream).release()
    expect(() => stream.getReader()).not.toThrow()
  })
})
