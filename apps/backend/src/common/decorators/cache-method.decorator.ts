export const CacheMethod = (ttlSecs: number): MethodDecorator => {
  let cached: unknown = null
  let valid = false

  return (_target: object, _propertyKey: string | symbol, descriptor: PropertyDescriptor): void => {
    const originalMethod: unknown = descriptor.value
    if (typeof originalMethod !== 'function') return

    // if I use arrow function instead, this would be Cache.
    descriptor.value = function (...args: unknown[]): unknown {
      if (valid) return cached

      cached = originalMethod.apply(this, args) // this = the method where the decorator is being applied.
      valid = true

      setTimeout(() => {
        valid = false
      }, ttlSecs * 1000)

      return cached
    }
  }
}
