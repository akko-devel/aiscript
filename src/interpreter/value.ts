import type { Scope } from './scope.js'
import type { Node } from '../node.js'

export type Attr = {
  attr?: {
    name: string
    value: Value
  }[]
}

export type Value = (
  | VArr
  | VBool
  | VBreak
  | VContinue
  | VError
  | VFn
  | VNull
  | VNum
  | VObj
  | VReturn
  | VStr
) & Attr

export type VArr = {
  type: 'arr'
  value: Value[]
}

export type VBool = {
  type: 'bool'
  value: boolean
}

export type VBreak = {
  type: 'break'
  value: null
}

export type VContinue = {
  type: 'continue'
  value: null
}

export type VError = {
  info?: Value
  type: 'error'
  value: string
}

/**
 * When your AiScript *native* function passes `VFn.call` to other caller(s)
 * whose error is thrown outside the scope, use `VFn.topCall` instead to keep it
 * under AiScript's error control system
 */
export type VFn = {
  args?: string[]
  native?: (
    args: (Value | undefined)[],
    opts: {
      call: (fn: VFn, args: Value[]) => Promise<Value>
      registerAbortHandler: (handler: () => void) => void
      topCall: (fn: VFn, args: Value[]) => Promise<Value>
      unregisterAbortHandler: (handler: () => void) => void
    }
  ) => Promise<Value> | Value | void
  scope?: Scope
  statements?: Node[]
  type: 'fn'
}

export type VNull = {
  type: 'null'
}

export type VNum = {
  type: 'num'
  value: number
}

export type VObj = {
  type: 'obj'
  value: Map<string, Value>
}

export type VReturn = {
  type: 'return'
  value: Value
}

export type VStr = {
  type: 'str'
  value: string
}

export const ARR = (arr: VArr['value']) => ({
  type: 'arr' as const,
  value: arr
}) as VArr

export const BOOL = (bool: VBool['value']) => ({
  type: 'bool' as const,
  value: bool
}) as VBool

export const BREAK = () => ({
  type: 'break' as const,
  value: null
}) as Value

export const CONTINUE = () => ({
  type: 'continue' as const,
  value: null
}) as Value

export const ERROR = (name: string, info?: Value) => ({
  info,
  type: 'error' as const,
  value: name
}) as Value

export const FALSE = {
  type: 'bool' as const,
  value: false
}

export const FN = (
  args: VFn['args'],
  statements: VFn['statements'],
  scope: VFn['scope']
) => ({
  args,
  scope,
  statements,
  type: 'fn' as const
}) as VFn

export const FN_NATIVE = (fn: VFn['native']) => ({
  native: fn,
  type: 'fn' as const
}) as VFn

export const NULL = {
  type: 'null' as const
}

export const NUM = (num: VNum['value']) => ({
  type: 'num' as const,
  value: num
}) as VNum

export const OBJ = (obj: VObj['value']) => ({
  type: 'obj' as const,
  value: obj
}) as VObj

export const RETURN = (value: VReturn['value']) => ({
  type: 'return' as const,
  value
}) as Value

export const STR = (str: VStr['value']) => ({
  type: 'str' as const,
  value: str
}) as VStr

export const TRUE = {
  type: 'bool' as const,
  value: true
}

export const unwrapRet = (value: Value) => value.type === 'return'
  ? value.value
  : value
