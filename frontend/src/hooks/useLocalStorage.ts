import { useEffect, useState } from 'react'

export function useLocalStorage(
  key: string
): [value: string | null, setValue: (value: string | null) => void]
export function useLocalStorage(
  key: string,
  initialValue: string
): [value: string, setValue: (value: string) => void]
export function useLocalStorage(
  key: string,
  initialValue: string | null = null
): [value: string | null, setValue: (value: string) => void] {
  const [value, setValue] = useState<string | null>(() => {
    const data = localStorage.getItem(key)
    return data ?? initialValue
  })

  useEffect(() => {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  }, [value, key])

  return [value, setValue]
}
