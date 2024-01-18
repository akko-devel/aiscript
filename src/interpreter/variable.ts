import type { Value } from './value.js'

export type Variable = {
  isMutable: false
  readonly value: Value
} | {
  isMutable: true
  value: Value
}

export const Variable = {
  const(value: Value) {
    return {
      isMutable: false,
      value
    } as Variable
  },
  mut(value: Value) {
    return {
      isMutable: true,
      value
    } as Variable
  }
}
