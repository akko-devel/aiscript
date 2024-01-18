import { getPrimitiveProp } from './primitive-props.js'
import { autobind } from '../utils/mini-autobind.js'
import { Variable } from './variable.js'
import type * as AST from '../node.js'
import * as Errors from '../error.js'
import * as Values from './value.js'
import * as Utils from './utils.js'
import { Scope } from './scope.js'
import { std } from './lib/std.js'

const IRQ_RATE = 300

const IRQ_AT = IRQ_RATE - 1

export class Interpreter {
  public scope: Scope
  public stepCount: number
  private abortHandlers: (() => void)[]

  private opts: {
    err?(e: Errors.AiScriptError): void
    in?(q: string): Promise<string>
    log?(type: string, params: Record<string, any>): void
    maxStep?: number
    out?(value: Values.Value): void
  }

  private stop: boolean
  private vars: Record<string, Variable>

  constructor(
    consts: Record<string, Values.Value>,
    opts: Interpreter['opts'] = {}
  ) {
    this.abortHandlers = []
    this.opts = opts
    this.stepCount = 0
    this.stop = false
    this.vars = {}

    const io = {
      print: Values.FN_NATIVE(([v]) => {
        Utils.expectAny(v)

        if (this.opts.out) {
          this.opts.out(v)
        }
      }),
      readline: Values.FN_NATIVE(async ([q]) => {
        Utils.assertString(q)

        if (!this.opts.in) {
          return Values.NULL
        }

        const a = await this.opts.in!(q.value)

        return Values.STR(a)
      })
    }

    this.vars = Object.fromEntries(
      Object.entries({
        ...consts,
        ...std,
        ...io
      }).map(([k, v]) => [k, Variable.const(v)])
    )

    this.scope = new Scope([new Map(Object.entries(this.vars))])
    this.scope.opts.log = (type, params) => {
      switch (type) {
        case 'add':
          this.log('var:add', params)

          break
        case 'read':
          this.log('var:read', params)

          break
        case 'write':
          this.log('var:write', params)

          break
        default:
          break
      }
    }
  }

  @autobind
  public abort() {
    this.stop = true

    for (const handler of this.abortHandlers) {
      handler()
    }

    this.abortHandlers = []
  }

  @autobind
  public static collectMetadata(script?: AST.Node[]) {
    if (!script || script.length === 0) {
      return undefined
    }

    function nodeToJs(node: AST.Node): any {
      switch (node.type) {
        case 'arr':
          return node.value.map(item => nodeToJs(item))
        case 'bool':
          return node.value
        case 'null':
          return null
        case 'num':
          return node.value
        case 'obj':
          const obj = {} as Record<
            string,
            boolean | number | object | string | null | undefined
          >

          for (const [k, v] of node.value.entries()) {
            obj[k] = nodeToJs(v)
          }

          return obj
      }
    }

    const meta = new Map<string, any>()

    for (const node of script) {
      switch (node.type) {
        case 'meta':
          meta.set(node.name!, nodeToJs(node.value))

          break
        default:
          break
      }
    }

    return meta
  }

  @autobind
  public async exec(script?: AST.Node[]) {
    if (!script || script.length === 0) { return }

    try {
      await this.collectNs(script)

      const result = await this._run(script, this.scope)

      this.log('end', { val: result })
    } catch (err) {
      this.handleError(err)
    }
  }

  /**
   * Execute an AiScript function
   *
   * @param fn The function to execute
   * @param args The arguments for the function
   */
  @autobind
  public async execFn(
    fn: Values.VFn,
    args: Values.Value[]
  ): Promise<Values.Value> {
    return await this._fn(fn, args).catch(err => {
      this.handleError(err)

      return Values.ERROR('func_failed')
    })
  }

  /**
   * Execute an AiScript function
   *
   * @param fn The function to execute
   * @param args The arguments for the function
   */
  @autobind
  public execFnSimple(
    fn: Values.VFn,
    args: Values.Value[]
  ): Promise<Values.Value> {
    return this._fn(fn, args)
  }

  @autobind
  public registerAbortHandler(handler: () => void) {
    this.abortHandlers.push(handler)
  }

  @autobind
  public unregisterAbortHandler(handler: () => void) {
    this.abortHandlers = this.abortHandlers.filter(h => h !== handler)
  }

  @autobind
  private async _eval(node: AST.Node, scope: Scope): Promise<Values.Value> {
    if (this.stop) {
      return Values.NULL
    }
    if (this.stepCount % IRQ_RATE === IRQ_AT) {
      await new Promise(res => setTimeout(res, 5))
    }

    this.stepCount++

    if (this.opts.maxStep && this.stepCount > this.opts.maxStep) {
      throw new Errors.AiScriptRuntimeError('max step exceeded')
    }

    switch (node.type) {
      case 'addAssign': {
        const target = await this._eval(node.dest, scope)

        Utils.assertNumber(target)

        const v = await this._eval(node.expr, scope)

        Utils.assertNumber(v)

        await this.assign(scope, node.dest, Values.NUM(target.value + v.value))

        return Values.NULL
      }

      case 'and': {
        const leftValue = await this._eval(node.left, scope)

        Utils.assertBoolean(leftValue)

        if (!leftValue.value) {
          return leftValue
        }

        const rightValue = await this._eval(node.right, scope)

        Utils.assertBoolean(rightValue)

        return rightValue
      }

      case 'arr': {
        return Values.ARR(
          await Promise.all(
            node.value.map(item => this._eval(item, scope))
          )
        )
      }

      case 'assign': {
        const v = await this._eval(node.expr, scope)

        await this.assign(scope, node.dest, v)

        return Values.NULL
      }

      case 'block': {
        return this._run(node.statements, scope.createChildScope())
      }

      case 'bool': {
        return Values.BOOL(node.value)
      }

      case 'break': {
        this.log('block:break', { scope: scope.name })

        return Values.BREAK()
      }

      case 'call': {
        const callee = await this._eval(node.target, scope)

        Utils.assertFunction(callee)

        const args = await Promise.all(
          node.args.map(expr => this._eval(expr, scope))
        )

        return this._fn(callee, args)
      }

      case 'continue': {
        this.log('block:continue', { scope: scope.name })

        return Values.CONTINUE()
      }

      case 'def': {
        const value = await this._eval(node.expr, scope)

        if (node.attr.length > 0) {
          const attrs = [] as NonNullable<Values.Value['attr']>

          for (const nAttr of node.attr) {
            attrs.push({
              name: nAttr.name,
              value: await this._eval(nAttr.value, scope)
            })
          }

          value.attr = attrs
        }

        scope.add(node.name, {
          isMutable: node.mut,
          value
        })

        return Values.NULL
      }

      case 'each': {
        const items = await this._eval(node.items, scope)

        Utils.assertArray(items)

        for (const item of items.value) {
          const v = await this._eval(
            node.for,
            scope.createChildScope(
              new Map([
                [
                  node.var,
                  {
                    isMutable: false,
                    value: item
                  }
                ]
              ])
            )
          )

          if (v.type === 'break') {
            break
          } else if (v.type === 'return') {
            return v
          }
        }

        return Values.NULL
      }

      case 'exists': {
        return Values.BOOL(scope.exists(node.identifier.name))
      }

      case 'fn': {
        return Values.FN(node.args.map(arg => arg.name), node.children, scope)
      }

      case 'for': {
        if (node.times) {
          const times = await this._eval(node.times, scope)

          Utils.assertNumber(times)

          for (let i = 0; i < times.value; i++) {
            const v = await this._eval(node.for, scope)

            if (v.type === 'break') {
              break
            } else if (v.type === 'return') {
              return v
            }
          }
        } else {
          const from = await this._eval(node.from!, scope)
          const to = await this._eval(node.to!, scope)

          Utils.assertNumber(from)
          Utils.assertNumber(to)

          for (let i = from.value; i < from.value + to.value; i++) {
            const v = await this._eval(
              node.for,
              scope.createChildScope(
                new Map([
                  [
                    node.var!,
                    {
                      isMutable: false,
                      value: Values.NUM(i)
                    }
                  ]
                ])
              )
            )

            if (v.type === 'break') {
              break
            } else if (v.type === 'return') {
              return v
            }
          }
        }

        return Values.NULL
      }

      case 'identifier': {
        return scope.get(node.name)
      }

      case 'if': {
        const cond = await this._eval(node.cond, scope)

        Utils.assertBoolean(cond)

        if (cond.value) {
          return this._eval(node.then, scope)
        } else {
          if (node.elseif && node.elseif.length > 0) {
            for (const elseif of node.elseif) {
              const cond = await this._eval(elseif.cond, scope)

              Utils.assertBoolean(cond)

              if (cond.value) {
                return this._eval(elseif.then, scope)
              }
            }

            if (node.else) {
              return this._eval(node.else, scope)
            }
          } else if (node.else) {
            return this._eval(node.else, scope)
          }
        }

        return Values.NULL
      }

      case 'index': {
        const i = await this._eval(node.index, scope)
        const target = await this._eval(node.target, scope)

        if (Utils.isArray(target)) {
          Utils.assertNumber(i)

          const item = target.value[i.value]

          if (!item) {
            throw new Errors.AiScriptIndexOutOfRangeError(
              `index out of range. index: ${i.value} max: ${target.value.length - 1}`
            )
          }

          return item
        } else if (Utils.isObject(target)) {
          Utils.assertString(i)

          if (target.value.has(i.value)) {
            return target.value.get(i.value)!
          }

          return Values.NULL
        }

        throw new Errors.AiScriptRuntimeError(
          `cannot read prop (${Utils.reprValue(i)}) of ${target.type}`
        )
      }

      case 'loop': {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const v = await this._run(node.statements, scope.createChildScope())

          if (v.type === 'break') {
            break
          } else if (v.type === 'return') {
            return v
          }
        }

        return Values.NULL
      }

      case 'match': {
        const about = await this._eval(node.about, scope)

        for (const qa of node.qs) {
          const q = await this._eval(qa.q, scope)

          if (Utils.eq(about, q)) {
            return await this._eval(qa.a, scope)
          }
        }

        if (node.default) {
          return await this._eval(node.default, scope)
        }

        return Values.NULL
      }

      case 'meta': {
        return Values.NULL // noop
      }

      case 'not': {
        const v = await this._eval(node.expr, scope)

        Utils.assertBoolean(v)

        return Values.BOOL(!v.value)
      }

      case 'ns': {
        return Values.NULL // noop
      }

      case 'null': {
        return Values.NULL
      }

      case 'num': {
        return Values.NUM(node.value)
      }

      case 'obj': {
        const obj = new Map<string, Values.Value>()

        for (const k of node.value.keys()) {
          obj.set(k, await this._eval(node.value.get(k)!, scope))
        }

        return Values.OBJ(obj)
      }

      case 'or': {
        const leftValue = await this._eval(node.left, scope)

        Utils.assertBoolean(leftValue)

        if (leftValue.value) {
          return leftValue
        }

        const rightValue = await this._eval(node.right, scope)

        Utils.assertBoolean(rightValue)

        return rightValue
      }

      case 'prop': {
        const target = await this._eval(node.target, scope)

        if (Utils.isObject(target)) {
          if (target.value.has(node.name)) {
            return target.value.get(node.name)!
          }

          return Values.NULL
        }

        return getPrimitiveProp(target, node.name)
      }

      case 'return': {
        const val = await this._eval(node.expr, scope)

        this.log('block:return', { scope: scope.name, val })

        return Values.RETURN(val)
      }

      case 'str': {
        return Values.STR(node.value)
      }

      case 'subAssign': {
        const target = await this._eval(node.dest, scope)

        Utils.assertNumber(target)

        const v = await this._eval(node.expr, scope)

        Utils.assertNumber(v)

        await this.assign(scope, node.dest, Values.NUM(target.value - v.value))

        return Values.NULL
      }

      case 'tmpl': {
        let str = ''

        for (const x of node.tmpl) {
          if (typeof x === 'string') {
            str += x
          } else {
            const v = await this._eval(x, scope)

            str += Utils.reprValue(v)
          }
        }

        return Values.STR(str)
      }

      default: {
        throw new Error('invalid node type')
      }
    }
  }

  @autobind
  private async _fn(
    fn: Values.VFn,
    args: Values.Value[]
  ): Promise<Values.Value> {
    if (fn.native) {
      const result = fn.native(args, {
        call: this.execFnSimple,
        registerAbortHandler: this.registerAbortHandler,
        topCall: this.execFn,
        unregisterAbortHandler: this.unregisterAbortHandler
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return result ?? Values.NULL
    } else {
      const _args = new Map<string, Variable>()

      for (let i = 0; i < (fn.args ?? []).length; i++) {
        _args.set(fn.args![i]!, {
          isMutable: true,
          value: args[i]!
        })
      }

      const fnScope = fn.scope!.createChildScope(_args)

      return Values.unwrapRet(await this._run(fn.statements!, fnScope))
    }
  }

  @autobind
  private async _run(program: AST.Node[], scope: Scope): Promise<Values.Value> {
    this.log('block:enter', { scope: scope.name })

    let v: Values.Value = Values.NULL

    for (let i = 0; i < program.length; i++) {
      const node = program[i]!

      v = await this._eval(node, scope)

      if (v.type === 'return') {
        this.log('block:return', { scope: scope.name, val: v.value })

        return v
      } else if (v.type === 'break') {
        this.log('block:break', { scope: scope.name })

        return v
      } else if (v.type === 'continue') {
        this.log('block:continue', { scope: scope.name })

        return v
      }
    }

    this.log('block:leave', { scope: scope.name, val: v })

    return v
  }

  @autobind
  private async assign(
    scope: Scope,
    dest: AST.Expression,
    value: Values.Value
  ) {
    if (dest.type === 'identifier') {
      scope.assign(dest.name, value)
    } else if (dest.type === 'index') {
      const assignee = await this._eval(dest.target, scope)
      const i = await this._eval(dest.index, scope)

      if (Utils.isArray(assignee)) {
        Utils.assertNumber(i)

        if (assignee.value[i.value] === undefined) {
          throw new Errors.AiScriptIndexOutOfRangeError(
            `index out of range. index: ${i.value} max: ${
              assignee.value.length - 1
            }`
          )
        }

        assignee.value[i.value] = value
      } else if (Utils.isObject(assignee)) {
        Utils.assertString(i)

        assignee.value.set(i.value, value)
      } else {
        throw new Errors.AiScriptRuntimeError(
          `cannot read prop (${Utils.reprValue(i)}) of ${assignee.type}`
        )
      }
    } else if (dest.type === 'prop') {
      const assignee = await this._eval(dest.target, scope)

      Utils.assertObject(assignee)

      assignee.value.set(dest.name, value)
    } else {
      throw new Errors.AiScriptRuntimeError(
        'the left-hand side of an assignment expression must be a variable or a index/property access'
      )
    }
  }

  @autobind
  private async collectNs(script: AST.Node[]) {
    for (const node of script) {
      switch (node.type) {
        case 'ns':
          this.collectNsMember(node)

          break
        default:
          break
      }
    }
  }

  @autobind
  private async collectNsMember(ns: AST.Namespace) {
    const scope = this.scope.createChildScope()

    for (const node of ns.members) {
      switch (node.type) {
        case 'def':
          if (node.mut) {
            throw new Error(
              `namespaces cannot include mutable variable: ${node.name}`
            )
          }

          const variable = {
            isMutable: node.mut,
            value: await this._eval(node.expr, scope)
          } as Variable

          scope.add(node.name, variable)

          this.scope.add(`${ns.name}:${node.name}`, variable)

          break
        case 'ns':
          break // TODO
        default:
          throw new Error(`invalid ns member type: ${(node as AST.Node).type}`)
      }
    }
  }

  @autobind
  private handleError(err: any) {
    if (this.opts.err) {
      if (!this.stop) {
        this.abort()

        if (err instanceof Errors.AiScriptError) {
          this.opts.err(err)
        } else {
          this.opts.err(new Errors.NonAiScriptError(err))
        }
      }
    } else {
      throw err
    }
  }

  @autobind
  private log(type: string, params: Record<string, unknown>) {
    if (this.opts.log) {
      this.opts.log(type, params)
    }
  }
}
