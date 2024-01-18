import { AiScriptSyntaxError } from '../../error.js'
import type * as CST from '../node.js'

export function setAttribute(node: CST.Expression[]): CST.Expression[]
export function setAttribute(node: (CST.Expression | CST.Statement)[]): (CST.Expression | CST.Statement)[]
export function setAttribute(node: CST.Node[]): CST.Node[]
export function setAttribute(node: CST.Statement[]): CST.Statement[]
export function setAttribute(nodes: CST.Node[]): CST.Node[] {
  const result = [] as CST.Node[]
  const stockedAttrs = [] as CST.Attribute[]

  for (const node of nodes) {
    if (node.type === 'attr') {
      stockedAttrs.push(node)
    } else if (node.type === 'def') {
      node.attr ??= []

      node.attr.push(...stockedAttrs)

      // Clear all attributes
      stockedAttrs.splice(0, stockedAttrs.length)

      if (node.expr.type === 'fn') {
        node.expr.children = setAttribute(node.expr.children)
      }

      result.push(node)
    } else {
      if (stockedAttrs.length > 0) {
        throw new AiScriptSyntaxError('invalid attribute')
      }

      switch (node.type) {
        case 'block':
          node.statements = setAttribute(node.statements)

          break
        case 'fn':
          node.children = setAttribute(node.children)

          break
      }

      result.push(node)
    }
  }

  if (stockedAttrs.length > 0) {
    throw new AiScriptSyntaxError('invalid attribute')
  }

  return result
}
