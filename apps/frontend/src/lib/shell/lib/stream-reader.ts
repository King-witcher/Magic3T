export interface IStreamReader extends AsyncIterable<string> {
  readChar(): Promise<string | null>
  readLine(): Promise<string | null>
  read(n: number): Promise<string | null>
  peekChar(): Promise<string | null>
  readAll(): Promise<string>
  lines(): AsyncGenerator<string>
  release(): void
}

/** Not meant to be read concurrently. */
export class StreamReader implements IStreamReader {
  private readonly reader: ReadableStreamDefaultReader<string>
  private buffer = ''
  private eof = false

  constructor(stream: ReadableStream<string>) {
    this.reader = stream.getReader()
  }

  async readChar(): Promise<string | null> {
    if (!(await this.ensure(1))) return null
    return this.take(1)
  }

  async readLine(): Promise<string | null> {
    let line = ''
    for (;;) {
      const newLine = this.buffer.indexOf('\n')

      if (newLine === -1) {
        line += this.take(this.buffer.length)
        if (!(await this.fill())) {
          return line || null
        }
      } else {
        line += this.take(newLine)
        this.take(1)
        if (line[line.length - 1] === '\r') line = line.slice(0, -1)
        return line
      }
    }
  }

  async *lines(): AsyncGenerator<string> {
    for (;;) {
      const line = await this.readLine()
      if (line === null) return
      yield line
    }
  }

  [Symbol.asyncIterator]() {
    return this.lines()
  }

  async read(n: number): Promise<string | null> {
    if (n <= 0) return ''
    await this.ensure(n)
    return this.take(n) || null
  }

  async peekChar(): Promise<string | null> {
    await this.ensure(1)
    return this.buffer.length ? this.buffer[0] : null
  }

  async readAll(): Promise<string> {
    while (await this.fill());
    return this.take(this.buffer.length)
  }

  /** Remaining content in the buffer is discarded */
  release() {
    this.reader.releaseLock()
  }

  /** Fills the buffer with data from the stream */
  private async fill(): Promise<boolean> {
    if (this.eof) return false

    const { done, value } = await this.reader.read()

    if (done) this.eof = true
    if (value) this.buffer += value

    return !done
  }

  private async ensure(n: number): Promise<boolean> {
    while (this.buffer.length < n) {
      if (!(await this.fill())) return false
    }

    return true
  }

  /** Takes from the buffer without touching the stream */
  private take(n: number): string {
    const out = this.buffer.slice(0, n)
    this.buffer = this.buffer.slice(n)
    return out
  }
}
