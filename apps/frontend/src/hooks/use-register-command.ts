import { DependencyList, useEffect } from 'react'
import { Cmd, Console } from '@/lib/console'

export function useRegisterCommand(cmd: Cmd, deps: DependencyList = []) {
  useEffect(() => Console.addCommand(cmd), deps)
}
