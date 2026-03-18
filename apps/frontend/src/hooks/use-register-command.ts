import { DependencyList, useEffect } from 'react'
import { Cmd, Console } from '@/lib/console'

/** Registers a console command with optional dependencies. */
export function useRegisterCommand(cmd: Cmd, deps: DependencyList = []) {
  useEffect(() => Console.addCommand(cmd), deps)
}
