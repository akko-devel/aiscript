export function autobind<T extends (...args: any[]) => any>(
  target: object,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | void {
  let fn = descriptor.value!

  return {
    configurable: true,
    get() {
      const bound = fn.bind(this)

      Object.defineProperty(
        this,
        key,
        {
          configurable: true,
          value: bound,
          writable: true
        }
      )

      return bound as T
    },
    set(value) {
      fn = value
    }
  }
}
