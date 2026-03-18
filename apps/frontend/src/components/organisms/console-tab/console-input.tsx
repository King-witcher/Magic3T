import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useKeyListener } from '@/hooks/use-key-listener'

interface Props {
  onSubmit: (value: string) => void
  focused: boolean
}

const printableChars = new Set([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',

  '~',
  '!',
  '@',
  '#',
  '$',
  '^',
  '&',
  '*',
  '(',
  ')',
  '-',
  '_',
  '=',
  '+',

  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',

  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',

  '[',
  ']',
  '{',
  '}',
  '\\',
  '|',

  ';',
  ':',
  '"',
  "'",

  ',',
  '<',
  '.',
  '>',
  '/',
  '?',

  ' ',
])

export function ConsoleInput({ onSubmit, focused }: Props) {
  // History of commands sent
  const [history, setHistory] = useState<string[]>([])

  // Replica of the story that the user can navigate. Reset after submit
  const [inputs, setInputs] = useState<string[]>([''])

  // Cursor in the inputs
  const [inputsCursor, setInputsCursor] = useState(0)

  // Cursor in current line
  const [lineCursor, setLineCursor] = useState(0)

  // Current value to be shown
  const currentInput = inputs[inputsCursor]
  const setCurrentInput: Dispatch<SetStateAction<string>> = useCallback(
    (value) => {
      setInputs((prevInputs: string[]) => {
        const newInputs = [...prevInputs]
        newInputs[inputsCursor] =
          typeof value === 'function' ? value(newInputs[inputsCursor]) : value
        return newInputs
      })
    },
    [inputsCursor]
  )

  // Spaces before cursor for rendering
  const spacesBeforeCursor = ' '.repeat(lineCursor + 1)

  // Submit on Enter
  useKeyListener(
    'Enter',
    (e) => {
      e.preventDefault()
      if (currentInput.trim()) {
        // Update history
        setHistory((prev) => [...prev, currentInput])

        // Update inputs with history
        setInputs([...history, currentInput, ''])

        // Point current input to the last line
        setInputsCursor(history.length + 1)

        // Reset line cursor
        setLineCursor(0)

        // Call onSubmit
        onSubmit(currentInput)
      }
    },
    [inputs, inputsCursor, onSubmit],
    focused
  )

  // Handle Backspace
  useKeyListener(
    'Backspace',
    (e) => {
      e.preventDefault()
      if (lineCursor > 0) {
        setCurrentInput((prev) => prev.slice(0, lineCursor - 1) + prev.slice(lineCursor))
        setLineCursor(lineCursor - 1)
      }
    },
    [lineCursor],
    focused
  )

  // Handle Delete
  useKeyListener(
    'Delete',
    (e) => {
      e.preventDefault()
      if (lineCursor < currentInput.length) {
        setCurrentInput((prev) => prev.slice(0, lineCursor) + prev.slice(lineCursor + 1))
      }
    },
    [currentInput, lineCursor],
    focused
  )

  useKeyListener(
    'ArrowLeft',
    (e) => {
      e.preventDefault()
      setLineCursor((prev) => Math.max(0, prev - 1))
    },
    [],
    focused
  )

  useKeyListener(
    'ArrowRight',
    (e) => {
      e.preventDefault()
      setLineCursor((prev) => Math.min(currentInput.length, prev + 1))
    },
    [currentInput],
    focused
  )

  // Navigate command history
  useKeyListener(
    'ArrowUp',
    (e) => {
      e.preventDefault()
      setInputsCursor((prev) => {
        const newCursor = Math.max(0, prev - 1)
        setLineCursor(inputs[newCursor].length)
        return newCursor
      })
    },
    [currentInput, inputs],
    focused
  )

  // Navigate command history
  useKeyListener(
    'ArrowDown',
    (e) => {
      e.preventDefault()
      setInputsCursor((prev) => {
        const newCursor = Math.min(inputs.length - 1, prev + 1)
        setLineCursor(inputs[newCursor].length)
        return newCursor
      })
    },
    [currentInput, inputs],
    focused
  )

  useEffect(() => {
    if (!focused) return

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      if (printableChars.has(event.key)) {
        setCurrentInput((prev) => prev.slice(0, lineCursor) + event.key + prev.slice(lineCursor))
        setLineCursor((prev) => prev + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lineCursor, focused])

  return (
    <pre className="relative">
      ]{currentInput}
      <pre className="absolute inset-0 animate-blink pointer-events-none">
        {spacesBeforeCursor}_
      </pre>
    </pre>
  )
}
