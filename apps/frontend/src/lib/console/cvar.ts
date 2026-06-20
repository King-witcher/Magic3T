import { useSyncExternalStore } from 'react'
import { ExposedEmitter } from './exposed-emitter'

export type CVarValue = string | number | boolean

export type CVar = {
  id: string
  readonly: boolean
  description?: string
} & (
  | {
      type: 'string'
      default: string
      value: string
    }
  | {
      type: 'number'
      integer: boolean
      default: number
      value: number
      min: number
      max: number
    }
  | {
      type: 'boolean'
      default: boolean
      value: boolean
    }
)

export const enum SystemCvarId {
  ClStatusPoll = 'cl_statuspoll',
  ConStyle = 'con_style',
  SvApiUrl = 'sv_apiurl',
  SvLogWs = 'sv_logws',
  Ui3TMode = 'ui_3tmode',
  UiPugMode = 'ui_pugmode',
}

export const enum ConStyle {
  Default = 0,
  Q3 = 1,
}

const SYSTEM_CVARS: Readonly<CVar>[] = [
  {
    id: SystemCvarId.ClStatusPoll,
    type: 'number',
    default: 5000,
    value: 5000,
    readonly: false,
    description: 'Interval for status polling',
    min: 50,
    max: Number.POSITIVE_INFINITY,
    integer: true,
  },
  {
    id: SystemCvarId.ConStyle,
    type: 'number',
    default: ConStyle.Default,
    value: ConStyle.Default,
    min: ConStyle.Default,
    max: ConStyle.Q3,
    integer: true,
    readonly: false,
    description: 'Console style',
  },
  {
    id: SystemCvarId.SvApiUrl,
    type: 'string',
    default: import.meta.env.VITE_API_URL,
    value: import.meta.env.VITE_API_URL,
    readonly: false,
    description: 'URL of the backend API',
  },
  {
    id: SystemCvarId.SvLogWs,
    type: 'boolean',
    default: false,
    value: false,
    readonly: false,
    description: 'Enable WebSocket logging',
  },
  {
    id: SystemCvarId.Ui3TMode,
    type: 'boolean',
    value: false,
    default: false,
    readonly: false,
    description: 'Enable 3T mode cheat in the UI',
  },
  {
    id: SystemCvarId.UiPugMode,
    type: 'boolean',
    value: false,
    default: false,
    readonly: false,
    description: 'Enable PUG mode in the UI',
  },
]

type TypeNames = {
  string: string
  number: number
  boolean: boolean
}

class CvarStore {
  //#region public:
  constructor() {
    this.map = new Map(SYSTEM_CVARS.map((cvar) => [cvar.id, cvar]))
    this.changeEmitter = new ExposedEmitter()
  }

  public get(id: string): CVarValue | null {
    CvarStore.validateId(id)

    const cvar = this.map.get(id)
    const value = cvar?.value ?? null

    return value
  }

  public getCvar(id: string): Readonly<CVar> | null {
    CvarStore.validateId(id)

    const cvar = this.map.get(id) ?? null

    return cvar
  }

  public set(id: string, valueString: string) {
    CvarStore.validateId(id)

    const cvar = this.map.get(id)
    if (!cvar) throw new Error(`cvar "${id}" does not exist`)

    if (cvar.readonly) throw new Error(`cvar "${id}" is read-only`)

    switch (cvar.type) {
      case 'string':
        cvar.value = valueString
        break
      case 'number':
        cvar.value = CvarStore.parseNumber(cvar, valueString)
        break
      case 'boolean':
        cvar.value = CvarStore.parseBool(cvar, valueString)
        break
    }

    this.changeEmitter.publicEmit(id)
  }

  public getString(id: string): string {
    return this.getAsserted(id, 'string')
  }

  public getNumber(id: string): number {
    return this.getAsserted(id, 'number')
  }

  public getBool(id: string): boolean {
    return this.getAsserted(id, 'boolean')
  }

  public useValue(id: string): CVarValue | null {
    return useSyncExternalStore(
      (callback) => this.changeEmitter.on(id, callback),
      () => this.map.get(id)?.value ?? null
    )
  }

  public useString(id: string): string {
    return this.useAsserted(id, 'string')
  }

  public useNumber(id: string): number {
    return this.useAsserted(id, 'number')
  }

  public useBool(id: string): boolean {
    return this.useAsserted(id, 'boolean')
  }

  public list(): Readonly<CVar>[] {
    return Array.from(this.map.values())
  }
  //#endregion

  //#region private:
  private readonly map: Map<string, CVar>
  private readonly changeEmitter: ExposedEmitter<Record<string, () => void>>

  private static parseNumber(
    cvar: Readonly<CVar & { type: 'number' }>,
    valueString: string
  ): number {
    const num = Number(valueString)

    if (Number.isNaN(num)) throw new Error(`cvar "${cvar.id}" requires a numeric value`)
    if (cvar.integer && !Number.isInteger(num))
      throw new Error(`cvar "${cvar.id}" requires an integer value`)
    if (num < cvar.min || num > cvar.max)
      throw new Error(`cvar "${cvar.id}" requires a value between ${cvar.min} and ${cvar.max}`)

    return num
  }

  private static parseBool(cvar: CVar, valueString: string): boolean {
    if (valueString === '1' || valueString.toLocaleLowerCase() === 'true') return true
    if (valueString === '0' || valueString.toLocaleLowerCase() === 'false') return false
    throw new Error(`cvar "${cvar.id}" requires a boolean value (0/1 or true/false)`)
  }

  private static validateId(id: string) {
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
      throw new Error(
        `invalid cvar id "${id}". Only alphanumeric characters and underscores are allowed`
      )
    }
  }

  private getAsserted<T extends keyof TypeNames>(id: string, type: T): TypeNames[T] {
    const value = this.get(id)
    if (value === null) throw new Error(`cvar "${id}" does not exist`)
    if (typeof value !== type) throw new Error(`cvar "${id}" is not of type "${type}"`)
    return value as TypeNames[T]
  }

  private useAsserted<T extends keyof TypeNames>(id: string, type: T): TypeNames[T] {
    const value = this.useValue(id)
    if (value === null) throw new Error(`cvar "${id}" does not exist`)
    if (typeof value !== type) throw new Error(`cvar "${id}" is not of type "${type}"`)
    return value as TypeNames[T]
  }
  //#endregion
}

export const cvars = new CvarStore()
