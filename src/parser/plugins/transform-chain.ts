import { visitNode } from '../visit.js'
import * as CST from '../node.js'

function transformNode(node: CST.Node): CST.Node {
  if (CST.isExpression(node) && CST.hasChainProp(node) && node.chain) {
    const { chain, ...hostNode } = node
    let parent: CST.Expression = hostNode

    for (const item of chain) {
      switch (item.type) {
        case 'callChain':
          parent = CST.CALL(parent, item.args, item.loc)

          break
        case 'indexChain':
          parent = CST.INDEX(parent, item.index, item.loc)

          break
        case 'propChain':
          parent = CST.PROP(parent, item.name, item.loc)

          break
        default:
          break
      }
    }

    return parent
  }

  return node
}

export function transformChain(nodes: CST.Node[]) {
  for (let i = 0; i < nodes.length; i++) {
    nodes[i] = visitNode(nodes[i]!, transformNode)
  }

  return nodes
}
