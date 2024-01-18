import { AiScriptSyntaxError } from './error.js'
import type * as AST from './node.js'

export type TFn = {
  args: Type[]
  result: Type
  type: 'fn'
}

export type TGeneric<N extends string = string> = {
  inners: Type[]
  name: N
  type: 'generic'
}

export type TSimple<N extends string = string> = {
  name: N
  type: 'simple'
}

export type Type = TFn | TGeneric | TSimple

function assertTFn(t: Type): asserts t is TFn {
  if (t.type !== 'fn') {
    throw new TypeError('`assertTFn` failed')
  }
}

function assertTGeneric(t: Type): asserts t is TGeneric {
  if (t.type !== 'generic') {
    throw new TypeError('`assertTGeneric` failed')
  }
}

function assertTSimple(t: Type): asserts t is TSimple {
  if (t.type !== 'simple') {
    throw new TypeError('`assertTSimple` failed')
  }
}

export function getTypeBySource(typeSource: AST.TypeSource): Type {
  if (typeSource.type === 'namedTypeSource') {
    switch (typeSource.name) {
      case 'any':
      case 'bool':
      case 'null':
      case 'num':
      case 'str':
      case 'void':
        if (!typeSource.inner) {
          return T_SIMPLE(typeSource.name)
        }

        break
      case 'arr':
      case 'obj':
        let innerType: Type

        if (typeSource.inner) {
          innerType = getTypeBySource(typeSource.inner)
        } else {
          innerType = T_SIMPLE('any')
        }

        return T_GENERIC(typeSource.name, [innerType])
    }

    throw new AiScriptSyntaxError(
      `unknown type: \`${getTypeNameBySource(typeSource)}\``
    )
  }

  const argTypes = typeSource.args.map(arg => getTypeBySource(arg))

  return T_FN(argTypes, getTypeBySource(typeSource.result))
}

export function getTypeName(type: Type): string {
  switch (type.type) {
    case 'fn':
      return `@(${type.args.map(arg => getTypeName(arg)).join(', ')}) { ${getTypeName(type.result)} }`
    case 'generic':
      return `${type.name}<${type.inners.map(inner => getTypeName(inner)).join(', ')}>`
    case 'simple':
      return type.name
  }
}

export function getTypeNameBySource(typeSource: AST.TypeSource): string {
  switch (typeSource.type) {
    case 'fnTypeSource':
      const args = typeSource.args.map(
        arg => getTypeNameBySource(arg)
      ).join(', ')

      const result = getTypeNameBySource(typeSource.result)

      return `@(${args}) { ${result} }`
    case 'namedTypeSource':
      if (typeSource.inner) {
        const inner = getTypeNameBySource(typeSource.inner)

        return `${typeSource.name}<${inner}>`
      }

      return typeSource.name
  }
}

export function isAny(x: Type): x is TSimple<'any'> {
  return x.type === 'simple' && x.name === 'any'
}

export function isCompatibleType(a: Type, b: Type) {
  if (isAny(a) || isAny(b)) { return true }
  if (a.type !== b.type) { return false }

  switch (a.type) {
    case 'fn':
      assertTFn(b)

      // Result
      if (!isCompatibleType(a.result, b.result)) { return false }

      // Args
      if (a.args.length !== b.args.length) { return false }

      for (let i = 0; i < a.args.length; i++) {
        if (!isCompatibleType(a.args[i]!, b.args[i]!)) { return false }
      }

      break
    case 'generic':
      assertTGeneric(b)

      // Name
      if (a.name !== b.name) { return false }

      // Inners
      if (a.inners.length !== b.inners.length) { return false }

      for (let i = 0; i < a.inners.length; i++) {
        if (!isCompatibleType(a.inners[i]!, b.inners[i]!)) { return false }
      }

      break
    case 'simple':
      assertTSimple(b)

      if (a.name !== b.name) { return false }

      break
  }

  return true
}

export function T_FN(args: Type[], result: Type) {
  return {
    args,
    result,
    type: 'fn'
  } as TFn
}

export function T_GENERIC<N extends string>(
  name: N,
  inners: Type[]
): TGeneric<N> {
  return {
    inners,
    name,
    type: 'generic'
  }
}

export function T_SIMPLE<T extends string>(name: T): TSimple<T> {
  return {
    name,
    type: 'simple'
  }
}
