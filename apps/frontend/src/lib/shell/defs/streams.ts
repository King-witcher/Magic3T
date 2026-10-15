export function lineSplitter() {
  let buffer = ''
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop()!
      for (const line of lines) {
        controller.enqueue(line)
      }
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer)
    },
  })
}
