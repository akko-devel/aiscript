import { autobind } from '../utils/mini-autobind.js'
import { AiScriptRuntimeError } from '../error.js'
import type { Variable } from './variable.js'
import type { Value } from './value.js'

export class Scope {
  public name: string
  public opts: {
    log?(type: string, params: Record<string, any>): void
    onUpdated?(name: string, value: Value): void
  }

  private layeredStates: Map<string, Variable>[]
  private parent?: Scope

  constructor(
    layeredStates: Scope['layeredStates'] = [],
    parent?: Scope,
    name?: Scope['name']
  ) {
    this.layeredStates = layeredStates
    this.name = name || (layeredStates.length === 1 ? '<root>' : '<anonymous>')
    this.opts = {}
    this.parent = parent
  }

  @autobind
  public add(name: string, variable: Variable) {
    this.log('add', { val: variable, var: name })

    const states = this.layeredStates[0]!

    if (states.has(name)) {
      throw new AiScriptRuntimeError(
        `variable \`${name}\` is already in scope \`${this.name}\``,
        {
          scope: this.layeredStates
        }
      )
    }

    states.set(name, variable)

    if (this.parent) {
      this.onUpdated(name, variable.value)
    }
  }

  @autobind
  public assign(name: string, val: Value) {
    let i = 1

    for (const layer of this.layeredStates) {
      if (layer.has(name)) {
        const variable = layer.get(name)!

        if (!variable.isMutable) {
          throw new AiScriptRuntimeError(
            `cannot assign a new value to immutable variable \`${name}\``
          )
        }

        variable.value = val

        this.log('assign', { val, var: name })

        if (i === this.layeredStates.length) { this.onUpdated(name, val) }

        return
      }

      i++
    }

    throw new AiScriptRuntimeError(
      `no such variable \`${name}\` in scope \`${this.name}\``,
      {
        scope: this.layeredStates
      }
    )
  }

  @autobind
  public createChildScope(
    states: Map<string, Variable> = new Map(),
    name?: Scope['name']
  ) {
    const layer = [states, ...this.layeredStates]

    return new Scope(layer, this, name)
  }

  @autobind
  public exists(name: string) {
    for (const layer of this.layeredStates) {
      if (layer.has(name)) {
        this.log('exists', { var: name })

        return true
      }
    }

    this.log('not exists', { var: name })

    return false
  }

  @autobind
  public get(name: string) {
    for (const layer of this.layeredStates) {
      if (layer.has(name)) {
        const state = layer.get(name)!.value

        this.log('read', { val: state, var: name })

        return state
      }
    }

    throw new AiScriptRuntimeError(
      `no such variable \`${name}\` in scope \`${this.name}\``,
      {
        scope: this.layeredStates
      }
    )
  }

  @autobind
  public getAll() {
    const vars = this.layeredStates.reduce(
      (arr, layer) => [...arr, ...layer],
      [] as [string, Variable][]
    )

    return new Map(vars)
  }

  @autobind
  private log(type: string, params: Record<string, any>) {
    if (this.parent) {
      this.parent.log(type, params)
    } else {
      if (this.opts.log) {
        this.opts.log(type, params)
      }
    }
  }

  @autobind
  private onUpdated(name: string, value: Value) {
    if (this.parent) {
      this.parent.onUpdated(name, value)
    } else {
      if (this.opts.onUpdated) {
        this.opts.onUpdated(name, value)
      }
    }
  }
}
