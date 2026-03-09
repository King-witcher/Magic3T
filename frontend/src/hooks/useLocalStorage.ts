import { captureException } from '@sentry/react'
import { useEffect, useState } from 'react'
import * as z from 'zod'
import { Console } from '@/lib/console'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  schema?: z.ZodType<T>
): [value: T, setValue: (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        return schema ? schema.parse(parsed) : parsed
      } catch (e) {
        Console.log(`Error parsing localStorage key "${key}"`)
        console.error(e)
        captureException(e)
        localStorage.setItem(key, JSON.stringify(initialValue))
        return initialValue
      }
    } else return initialValue
  })

  useEffect(() => {
    if (value === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [value, key])

  return [value, setValue]
}
