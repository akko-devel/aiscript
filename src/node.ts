type NodeBase = {
  loc?: LOC
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

export type Arr = NodeBase & {
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

export type Block = NodeBase & {
  statements: (Expression | Statement)[]
  type: 'block'
}

export type Bool = NodeBase & {
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

export type Continue = NodeBase & {
  type: 'continue'
}

export type Definition = NodeBase & {
  attr: Attribute[]
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

export type Exists = NodeBase & {
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
  | Match
  | Not
  | Null
  | Num
  | Obj
  | Or
  | Prop
  | Str
  | Tmpl

export type Fn = NodeBase & {
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
  for: Expression | Statement
  from?: Expression
  times?: Expression
  to?: Expression
  type: 'for'
  var?: string
}

export type Identifier = NodeBase & {
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

export type LOC = {
  end: number
  start: number
}

export type Loop = NodeBase & {
  statements: (Expression | Statement)[]
  type: 'loop'
}

export type Match = NodeBase & {
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
  | Expression
  | Meta
  | Namespace
  | Statement
  | TypeSource

export type Not = NodeBase & {
  expr: Expression
  type: 'not'
}

export type Null = NodeBase & {
  type: 'null'
}

export type Num = NodeBase & {
  type: 'num'
  value: number
}

export type Obj = NodeBase & {
  type: 'obj'
  value: Map<string, Expression>
}

export type Or = NodeBase & {
  left: Expression
  right: Expression
  type: 'or'
}

export type Prop = NodeBase & {
  name: string
  target: Expression
  type: 'prop'
}

export type Return = NodeBase & {
  expr: Expression
  type: 'return'
}

export type Statement =
  | AddAssign
  | Assign
  | Break
  | Continue
  | Definition
  | Each
  | For
  | Loop
  | Return
  | SubAssign

export type Str = NodeBase & {
  type: 'str'
  value: string
}

export type SubAssign = NodeBase & {
  dest: Expression
  expr: Expression
  type: 'subAssign'
}

export type Tmpl = NodeBase & {
  tmpl: (Expression | string)[]
  type: 'tmpl'
}

export type TypeSource = FnTypeSource | NamedTypeSource
