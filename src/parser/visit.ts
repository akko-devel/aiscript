import * as CST from './node.js'

export function visitNode(
  node: CST.Node,
  fn: (node: CST.Node) => CST.Node
): CST.Node {
  const result = fn(node)

  // Nested nodes
  switch (result.type) {
    case 'addAssign':
    case 'assign':
    case 'subAssign':
      result.dest = visitNode(result.dest, fn) as CST.Assign['dest']
      result.expr = visitNode(result.expr, fn) as CST.Assign['expr']

      break
    case 'and':
    case 'or':
      result.left = visitNode(result.left, fn) as (CST.And | CST.Or)['left']
      result.right = visitNode(result.right, fn) as (CST.And | CST.Or)['right']

      break
    case 'arr':
      for (let i = 0; i < result.value.length; i++) {
        result.value[i] =
          visitNode(result.value[i]!, fn) as CST.Arr['value'][number]
      }

      break
    case 'block':
      for (let i = 0; i < result.statements.length; i++) {
        result.statements[i] = visitNode(
          result.statements[i]!,
          fn
        ) as CST.Block['statements'][number]
      }

      break
    case 'call':
      result.target = visitNode(result.target, fn) as CST.Call['target']

      for (let i = 0; i < result.args.length; i++) {
        result.args[i] =
          visitNode(result.args[i]!, fn) as CST.Call['args'][number]
      }

      break
    case 'callChain':
      for (let i = 0; i < result.args.length; i++) {
        result.args[i] =
          visitNode(result.args[i]!, fn) as CST.CallChain['args'][number]
      }

      break
    case 'def':
      result.expr = visitNode(result.expr, fn) as CST.Definition['expr']

      break
    case 'each':
      result.for = visitNode(result.for, fn) as CST.Each['for']
      result.items = visitNode(result.items, fn) as CST.Each['items']

      break
    case 'exists':
      result.identifier =
        visitNode(result.identifier, fn) as CST.Exists['identifier']

      break
    case 'fn':
      for (let i = 0; i < result.children.length; i++) {
        result.children[i] =
          visitNode(result.children[i]!, fn) as CST.Fn['children'][number]
      }

      break
    case 'for':
      if (result.from) {
        result.from = visitNode(result.from, fn) as CST.For['from']
      }

      if (result.to) {
        result.to = visitNode(result.to, fn) as CST.For['to']
      }

      if (result.times) {
        result.times = visitNode(result.times, fn) as CST.For['times']
      }

      result.for = visitNode(result.for!, fn) as CST.For['for']

      break
    case 'if':
      result.cond = visitNode(result.cond, fn) as CST.If['cond']
      result.then = visitNode(result.then, fn) as CST.If['then']

      for (const prop of result.elseif) {
        prop.cond = visitNode(prop.cond, fn) as CST.If['elseif'][number]['cond']
        prop.then = visitNode(prop.then, fn) as CST.If['elseif'][number]['then']
      }

      if (result.else) {
        result.else = visitNode(result.else, fn) as CST.If['else']
      }

      break
    case 'index':
      result.index = visitNode(result.index, fn) as CST.Index['index']
      result.target = visitNode(result.target, fn) as CST.Index['target']

      break
    case 'indexChain':
      result.index = visitNode(result.index, fn) as CST.IndexChain['index']

      break
    case 'infix':
      for (let i = 0; i < result.operands.length; i++) {
        result.operands[i] =
          visitNode(result.operands[i]!, fn) as CST.Infix['operands'][number]
      }

      break
    case 'loop':
      for (let i = 0; i < result.statements.length; i++) {
        result.statements[i] =
          visitNode(result.statements[i]!, fn) as CST.Loop['statements'][number]
      }

      break
    case 'match':
      result.about = visitNode(result.about, fn) as CST.Match['about']

      for (const prop of result.qs) {
        prop.a = visitNode(prop.a, fn) as CST.Match['qs'][number]['a']
        prop.q = visitNode(prop.q, fn) as CST.Match['qs'][number]['q']
      }

      if (result.default) {
        result.default = visitNode(result.default, fn) as CST.Match['default']
      }

      break
    case 'not':
      result.expr = visitNode(result.expr, fn) as CST.Not['expr']

      break
    case 'ns':
      for (let i = 0; i < result.members.length; i++) {
        result.members[i] =
          visitNode(result.members[i]!, fn) as CST.Namespace['members'][number]
      }

      break
    case 'obj':
      for (const item of result.value) {
        result.value.set(item[0], visitNode(item[1], fn) as CST.Expression)
      }

      break
    case 'prop':
      result.target = visitNode(result.target, fn) as CST.Prop['target']

      break
    case 'return':
      result.expr = visitNode(result.expr, fn) as CST.Return['expr']

      break
    case 'tmpl':
      for (let i = 0; i < result.tmpl.length; i++) {
        const item = result.tmpl[i]

        if (typeof item !== 'string') {
          result.tmpl[i] = visitNode(item!, fn) as CST.Tmpl['tmpl'][number]
        }
      }

      break
  }

  if (CST.hasChainProp(result)) {
    if (result.chain) {
      for (let i = 0; i < result.chain.length; i++) {
        result.chain[i] = visitNode(result.chain[i]!, fn) as CST.ChainMember
      }
    }
  }

  return result
}
