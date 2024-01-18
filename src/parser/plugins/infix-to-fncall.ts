import { AiScriptSyntaxError } from '../../error.js'
import { visitNode } from '../visit.js'
import type * as CST from '../node.js'

type InfixTree = {
  info: {
    priority: number
  } & (
    {
      func: string
      mapFn?: undefined
    } | {
      func?: undefined
      mapFn: (infix: InfixTree) => CST.Node
    }
  )
  left: CST.Node | InfixTree
  right: CST.Node | CST.Infix
  type: 'infixTree'
}

const infoTable = {
  '*': {
    func: 'Core:mul',
    priority: 7
  },
  '^': {
    func: 'Core:pow',
    priority: 7
  },
  '/': {
    func: 'Core:div',
    priority: 7
  },
  '%': {
    func: 'Core:mod',
    priority: 7
  },
  '+': {
    func: 'Core:add',
    priority: 6
  },
  '-': {
    func: 'Core:sub',
    priority: 6
  },
  '==': {
    func: 'Core:eq',
    priority: 4
  },
  '!=': {
    func: 'Core:neq',
    priority: 4
  },
  '<': {
    func: 'Core:lt',
    priority: 4
  },
  '>': {
    func: 'Core:gt',
    priority: 4
  },
  '<=': {
    func: 'Core:lteq',
    priority: 4
  },
  '>=': {
    func: 'Core:gteq',
    priority: 4
  },
  '&&': {
    mapFn: infix => ({
      left: treeToNode(infix.left),
      right: treeToNode(infix.right),
      type: 'and'
    }) as CST.And,
    priority: 3
  },
  '||': {
    mapFn: infix => ({
      left: treeToNode(infix.left),
      right: treeToNode(infix.right),
      type: 'or'
    }) as CST.Or,
    priority: 3
  }
} as Record<string, InfixTree['info']>

function INFIX_TREE(
  left: CST.Node | InfixTree,
  right: CST.Node | InfixTree,
  info: InfixTree['info']
) {
  return { info, left, right, type: 'infixTree' } as InfixTree
}

function insertTree(
  currTree: CST.Node | InfixTree,
  nextTree: CST.Node | InfixTree,
  nextOpInfo: InfixTree['info']
): InfixTree {
  if (currTree.type !== 'infixTree') {
    return INFIX_TREE(currTree, nextTree, nextOpInfo)
  }

  if (nextOpInfo.priority <= currTree.info.priority) {
    return INFIX_TREE(currTree, nextTree, nextOpInfo)
  }

  const { info: currInfo, left, right } = currTree

  return INFIX_TREE(left, insertTree(right, nextTree, nextOpInfo), currInfo)
}

function transform(node: CST.Infix) {
  const infos = node.operators.map(op => {
    const info = infoTable[op]

    if (!info) {
      throw new AiScriptSyntaxError(`no such operator: \`${op}\``)
    }

    return info
  })

  let currTree = INFIX_TREE(node.operands[0]!, node.operands[1]!, infos[0]!)

  for (let i = 0; i < infos.length - 1; i++) {
    currTree = insertTree(currTree, node.operands[i + 2]!, infos[i + 1]!)
  }

  return treeToNode(currTree)
}

function treeToNode(tree: CST.Node | InfixTree): CST.Node {
  if (tree.type !== 'infixTree') {
    return tree
  }

  if (tree.info.mapFn) {
    return tree.info.mapFn(tree)
  }

  return {
    args: [treeToNode(tree.left), treeToNode(tree.right)],
    target: { name: tree.info.func, type: 'identifier' },
    type: 'call'
  } as CST.Call
}

export function infixToFnCall(nodes: CST.Node[]) {
  for (let i = 0; i < nodes.length; i++) {
    nodes[i] = visitNode(nodes[i]!, node => {
      if (node.type === 'infix') {
        return transform(node)
      }

      return node
    })
  }

  return nodes
}
