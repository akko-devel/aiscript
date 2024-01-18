import { getTypeBySource } from '../../type.js'
import { visitNode } from '../visit.js'
import type * as CST from '../node.js'

function validateNode(node: CST.Node) {
  switch (node.type) {
    case 'def':
      if (node.varType) {
        getTypeBySource(node.varType)
      }

      break
    case 'fn':
      for (const arg of node.args) {
        if (arg.argType) {
          getTypeBySource(arg.argType)
        }
      }

      if (node.retType) {
        getTypeBySource(node.retType)
      }

      break
  }

  return node
}

export function validateType(nodes: CST.Node[]) {
  for (const node of nodes) {
    visitNode(node, validateNode)
  }

  return nodes
}
