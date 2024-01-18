import { AiScriptSyntaxError } from '../../error.js'
import { visitNode } from '../visit.js'
import type * as CST from '../node.js'

const reservedWord = [
  'attr',
  'attribute',
  'break',
  'class',
  'continue',
  'each',
  'elif',
  'else',
  'eval',
  'exists',
  'export',
  'false',
  'fn',
  'for',
  'if',
  'import',
  'let',
  'loop',
  'match',
  'meta',
  'module',
  'namespace',
  'null',
  'return',
  'static',
  'struct',
  'true',
  'var',
  'while'
]

function throwReservedWordError(name: string) {
  throw new AiScriptSyntaxError(
    `reserved word \`${name}\` cannot be used as a variable name`
  )
}

function validateNode(node: CST.Node) {
  switch (node.type) {
    case 'attr':
    case 'def':
    case 'identifier':
    case 'ns':
    case 'propChain':
      if (reservedWord.includes(node.name)) {
        throwReservedWordError(node.name)
      }

      break
    case 'fn':
      for (const arg of node.args) {
        if (reservedWord.includes(arg.name)) {
          throwReservedWordError(arg.name)
        }
      }

      break
    case 'meta':
      if (node.name && reservedWord.includes(node.name)) {
        throwReservedWordError(node.name)
      }

      break
  }

  return node
}

export function validateKeyword(nodes: CST.Node[]) {
  for (const inner of nodes) {
    visitNode(inner, validateNode)
  }

  return nodes
}
