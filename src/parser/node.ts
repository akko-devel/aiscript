type ChainProp = {
  chain?: ChainMember[]
}

type NodeBase = {
  __AST_NODE: never
  loc?: {
    end: number
    start: number
  }
}

export type AddAssign = NodeBase & {
  dest: Expression
  expr: Expression
  type: 'addAssign'
}

export type And = NodeBase & {
  left: Expression
  right: Expression
  type: 'and'
}

export type Arr = NodeBase & ChainProp & {
  type: 'arr'
  value: Expression[]
}

export type Assign = NodeBase & {
  dest: Expression
  expr: Expression
  type: 'assign'
}

export type Attribute = NodeBase & {
  name: string
  type: 'attr'
  value: Expression
}

export type Block = NodeBase & ChainProp & {
  statements: (Expression | Statement)[]
  type: 'block'
}

export type Bool = NodeBase & ChainProp & {
  type: 'bool'
  value: boolean
}

export type Break = NodeBase & {
  type: 'break'
}

export type Call = NodeBase & {
  args: Expression[]
  target: Expression
  type: 'call'
}

export type CallChain = NodeBase & {
  args: Expression[]
  type: 'callChain'
}

export type ChainMember = CallChain | IndexChain | PropChain

export type Continue = NodeBase & {
  type: 'continue'
}

export type Definition = NodeBase & {
  attr?: Attribute[]
  expr: Expression
  mut: boolean
  name: string
  type: 'def'
  varType?: TypeSource
}

export type Each = NodeBase & {
  for: Expression | Statement
  items: Expression
  type: 'each'
  var: string
}

export type Exists = NodeBase & ChainProp & {
  identifier: Identifier
  type: 'exists'
}

export type Expression =
  | And
  | Arr
  | Block
  | Bool
  | Call
  | Exists
  | Fn
  | Identifier
  | If
  | Index
  | Infix
  | Match
  | Not
  | Null
  | Num
  | Obj
  | Or
  | Prop
  | Str
  | Tmpl

export type Fn = NodeBase & ChainProp & {
  args: {
    argType?: TypeSource
    name: string
  }[]
  children: (Expression | Statement)[]
  retType?: TypeSource
  type: 'fn'
}

export type FnTypeSource = NodeBase & {
  args: TypeSource[]
  result: TypeSource
  type: 'fnTypeSource'
}

export type For = NodeBase & {
  for?: Expression | Statement
  from?: Expression
  times?: Expression
  to?: Expression
  type: 'for'
  var?: string
}

export type Identifier = NodeBase & ChainProp & {
  name: string
  type: 'identifier'
}

export type If = NodeBase & {
  cond: Expression
  else?: Expression | Statement
  elseif: {
    cond: Expression
    then: Expression | Statement
  }[]
  then: Expression | Statement
  type: 'if'
}

export type Index = NodeBase & {
  index: Expression
  target: Expression
  type: 'index'
}

export type IndexChain = NodeBase & {
  index: Expression
  type: 'indexChain'
}

export type Infix = NodeBase & {
  operands: Expression[]
  operators: InfixOperator[]
  type: 'infix'
}

export type InfixOperator =
  | '||'
  | '&&'
  | '=='
  | '!='
  | '<='
  | '>='
  | '<'
  | '>'
  | '+'
  | '-'
  | '*'
  | '^'
  | '/'
  | '%'

export type Loop = NodeBase & {
  statements: (Expression | Statement)[]
  type: 'loop'
}

export type Match = NodeBase & ChainProp & {
  about: Expression
  default?: Expression | Statement
  qs: {
    a: Expression | Statement
    q: Expression
  }[]
  type: 'match'
}

export type Meta = NodeBase & {
  name: string | null
  type: 'meta'
  value: Expression
}

export type NamedTypeSource = NodeBase & {
  inner?: TypeSource
  name: string
  type: 'namedTypeSource'
}

export type Namespace = NodeBase & {
  members: (Definition | Namespace)[]
  name: string
  type: 'ns'
}

export type Node =
  | ChainMember
  | Expression
  | Meta
  | Namespace
  | Statement
  | TypeSource

export type Null = NodeBase & ChainProp & {
  type: 'null'
}

export type Num = NodeBase & ChainProp & {
  type: 'num'
  value: number
}

export type Obj = NodeBase & ChainProp & {
  type: 'obj'
  value: Map<string, Expression>
}

export type Or = NodeBase & {
  left: Expression
  right: Expression
  type: 'or'
}

export type Not = NodeBase & {
  expr: Expression
  type: 'not'
}

export type Prop = NodeBase & {
  name: string
  target: Expression
  type: 'prop'
}

export type PropChain = NodeBase & {
  name: string
  type: 'propChain'
}

export type Return = NodeBase & {
  expr: Expression
  type: 'return'
}

export type Statement =
  | AddAssign
  | Assign
  | Attribute
  | Break
  | Continue
  | Definition
  | Each
  | For
  | Loop
  | Return
  | SubAssign

export type Str = NodeBase & ChainProp & {
  type: 'str'
  value: string
}

export type SubAssign = NodeBase & {
  dest: Expression
  expr: Expression
  type: 'subAssign'
}

export type Tmpl = NodeBase & ChainProp & {
  tmpl: (Expression | string)[]
  type: 'tmpl'
}

export type TypeSource = FnTypeSource | NamedTypeSource

const expressionTypes = [
  'arr',
  'block',
  'bool',
  'call',
  'exists',
  'fn',
  'identifier',
  'if',
  'index',
  'infix',
  'match',
  'null',
  'num',
  'obj',
  'prop',
  'str',
  'tmpl'
]

const statementTypes = [
  'addAssign',
  'assign',
  'attr',
  'break',
  'continue',
  'def',
  'each',
  'for',
  'loop',
  'return',
  'subAssign'
]

export function CALL(
  target: Call['target'],
  args: Call['args'],
  loc?: {
    end: number
    start: number
  }
) {
  return {
    args,
    loc,
    target,
    type: 'call'
  } as Call
}

export function hasChainProp<T extends Node>(x: T): x is T & ChainProp {
  return 'chain' in x && x.chain !== null
}

export function INDEX(
  target: Index['target'],
  index: Index['index'],
  loc?: {
    end: number
    start: number
  }
) {
  return {
    index,
    loc,
    target,
    type: 'index'
  } as Index
}

export function isExpression(x: Node): x is Expression {
  return expressionTypes.includes(x.type)
}

export function isStatement(x: Node): x is Statement {
  return statementTypes.includes(x.type)
}

export function PROP(
  target: Prop['target'],
  name: Prop['name'],
  loc?: {
    end: number
    start: number
  }
) {
  return {
    loc,
    name,
    target,
    type: 'prop'
  } as Prop
}
