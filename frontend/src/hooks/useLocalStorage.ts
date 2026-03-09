import { useEffect, useState } from 'react'

export function useLocalStorage<T extends string = string>(
  key: string,
  initialValue: T
): [value: T, setValue: (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const data = localStorage.getItem(key)
    return (data ?? initialValue) as T
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
