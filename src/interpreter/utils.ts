import { AiScriptRuntimeError } from '../error.js'
import {
  ARR,
  BOOL,
  NULL,
  NUM,
  OBJ,
  STR,
  Value,
  VArr,
  VBool,
  VFn,
  VNum,
  VObj,
  VStr
} from './value.js'

export function assertArray(
  value: Value | null | undefined
): asserts value is VArr {
  if (!value) {
    throw new AiScriptRuntimeError('expected array, but got nothing')
  }

  if (value.type !== 'arr') {
    throw new AiScriptRuntimeError(`expected array, but got ${value.type}`)
  }
}

export function assertBoolean(
  value: Value | null | undefined
): asserts value is VBool {
  if (!value) {
    throw new AiScriptRuntimeError('expected boolean, but got nothing')
  }

  if (value.type !== 'bool') {
    throw new AiScriptRuntimeError(`expected boolean, but got ${value.type}`)
  }
}

export function assertFunction(
  value: Value | null | undefined
): asserts value is VFn {
  if (!value) {
    throw new AiScriptRuntimeError('expected function, but got nothing')
  }

  if (value.type !== 'fn') {
    throw new AiScriptRuntimeError(`expected function, but got ${value.type}`)
  }
}

export function assertNumber(
  value: Value | null | undefined
): asserts value is VNum {
  if (!value) {
    throw new AiScriptRuntimeError('expected number, but got nothing')
  }

  if (value.type !== 'num') {
    throw new AiScriptRuntimeError(`expected number, but got ${value.type}`)
  }
}

export function assertObject(
  value: Value | null | undefined
): asserts value is VObj {
  if (!value) {
    throw new AiScriptRuntimeError('expected object, but got nothing')
  }

  if (value.type !== 'obj') {
    throw new AiScriptRuntimeError(`expected object, but got ${value.type}`)
  }
}

export function assertString(
  value: Value | null | undefined
): asserts value is VStr {
  if (!value) {
    throw new AiScriptRuntimeError('expected string, but got nothing')
  }

  if (value.type !== 'str') {
    throw new AiScriptRuntimeError(`expected string, but got ${value.type}`)
  }
}

export function eq(a: Value, b: Value) {
  if (a.type === 'fn' || b.type === 'fn') { return false }
  if (a.type === 'null' && b.type === 'null') { return true }
  if (a.type === 'null' || b.type === 'null') { return false }

  return a.value === b.value
}

export function expectAny(
  value: Value | null | undefined
): asserts value is Value {
  if (!value) {
    throw new AiScriptRuntimeError('expected anything, but got nothing')
  }
}

export function getLangVersion(input: string) {
  const match = /^\s*\/\/\/\s*@\s*([A-Z0-9_.-]+)(?:[\r\n][\s\S]*)?$/i
    .exec(input)

  return match ? match[1]! : null
}

export function isArray(value: Value): value is VArr {
  return value.type === 'arr'
}

export function isBoolean(value: Value): value is VBool {
  return value.type === 'bool'
}

export function isFunction(value: Value): value is VFn {
  return value.type === 'fn'
}

export function isNumber(value: Value): value is VNum {
  return value.type === 'num'
}

export function isObject(value: Value): value is VObj {
  return value.type === 'obj'
}

export function isString(value: Value): value is VStr {
  return value.type === 'str'
}

export function jsToVal(value: any): Value {
  if (value === null) { return NULL }

  if (Array.isArray(value)) { return ARR(value.map(item => jsToVal(item))) }
  if (typeof value === 'boolean') { return BOOL(value) }
  if (typeof value === 'number') { return NUM(value) }
  if (typeof value === 'string') { return STR(value) }

  if (typeof value === 'object') {
    const obj = new Map<string, Value>()

    for (const [k, v] of Object.entries(value)) {
      obj.set(k, jsToVal(v))
    }

    return OBJ(obj)
  }

  return NULL
}

export function reprValue(
  value: Value,
  literalLike = false,
  processedObjects = new Set<object>()
) {
  if (
    (value.type === 'arr' || value.type === 'obj')
      && processedObjects.has(value.value)
  ) {
    return '...'
  }

  if (value.type === 'arr') {
    processedObjects.add(value.value)

    const content = [] as string[]

    for (const item of value.value) {
      content.push(reprValue(item, true, processedObjects))
    }

    return `[ ${content.join(', ')} ]`
  }

  if (value.type === 'bool') { return value.value.toString() }

  if (value.type === 'fn') {
    return `@( ${(value.args ?? []).join(', ')} ) { ... }`
  }

  if (value.type === 'null') { return 'null' }

  if (value.type === 'num') { return value.value.toString() }

  if (value.type === 'obj') {
    processedObjects.add(value.value)

    const content = [] as string[]

    for (const [k, v] of value.value) {
      content.push(`${k}: ${reprValue(v, true, processedObjects)}`)
    }

    return `{ ${content.join(', ')} }`
  }

  if (literalLike && value.type === 'str') {
    return `"${value.value.replace(/["\\\r\n]/g, x => `\\${x}`)}"`
  }

  if (value.type === 'str') { return value.value }

  return '?'
}

export function valToJs(value: Value): any {
  switch (value.type) {
    case 'arr':
      return value.value.map(item => valToJs(item))
    case 'bool':
      return value.value
    case 'fn':
      return '<function>'
    case 'null':
      return null
    case 'num':
      return value.value
    case 'obj':
      const obj =
        {} as Record<string, boolean | number | object | string | null>

      for (const [k, v] of value.value.entries()) {
        obj[k] = valToJs(v)
      }

      return obj
    case 'str':
      return value.value
    default:
      throw new Error(`unrecognized value type \`${value.type}\``)
  }
}

export function valToString(value: Value, simple = false): string {
  if (simple) {
    if (value.type === 'arr') {
      return `[${value.value.map(item => valToString(item, true)).join(', ')}]`
    }

    if (value.type === 'bool') { return value.value ? 'true' : 'false' }
    if (value.type === 'null') { return '(null)' }
    if (value.type === 'num') { return value.value.toString() }
    if (value.type === 'str') { return `"${value.value}"` }
  }

  const label =
    value.type === 'num'
      ? value.value
      : value.type === 'bool'
        ? value.value
        : value.type === 'str'
          ? `"${value.value}"`
          : value.type === 'fn'
            ? '...'
            : value.type === 'obj'
              ? '...'
              : value.type === 'null'
                ? ''
                : null

  return `${value.type}<${label}>`
}
