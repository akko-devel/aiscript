import { validateKeyword } from './plugins/validate-keyword.js'
import { transformChain } from './plugins/transform-chain.js'
import { infixToFnCall } from './plugins/infix-to-fncall.js'
import { setAttribute } from './plugins/set-attribute.js'
import { validateType } from './plugins/validate-type.js'
import { AiScriptSyntaxError } from '../error.js'
import type * as AST from '../node.js'
import type * as CST from './node.js'
import * as parser from './parser.js'

export type ParserPlugin = (nodes: CST.Node[]) => CST.Node[]
export type PluginType = 'transform' | 'validate'

export class Parser {
  private static instance?: Parser
  private plugins: {
    transform: ParserPlugin[]
    validate: ParserPlugin[]
  }

  constructor() {
    this.plugins = {
      transform: [
        setAttribute,
        transformChain,
        infixToFnCall
      ],
      validate: [
        validateKeyword,
        validateType
      ]
    }
  }

  public addPlugin(type: PluginType, plugin: ParserPlugin) {
    switch (type) {
      case 'transform':
        this.plugins.transform.push(plugin)

        break
      case 'validate':
        this.plugins.validate.push(plugin)

        break
      default:
        throw new Error('unknown plugin type')
    }
  }

  public parse(input: string): AST.Node[] {
    let nodes: CST.Node[]

    // Generate a node tree
    try {
      // Apply preprocessor
      const code = parser.parse(input, { startRule: 'Preprocess' })

      // Apply main parser
      nodes = parser.parse(code, { startRule: 'Main' })
    } catch (err: any) {
      if (err.location) {
        if (err.expected) {
          throw new AiScriptSyntaxError(
            `parsing error (line ${err.location.start.line}:${err.location.start.column})`,
            err
          )
        }

        throw new AiScriptSyntaxError(
          `${err.message} (line ${err.location.start.line}:${err.location.start.column})`,
          err
        )
      }

      throw err
    }

    // Validate the node tree
    for (const plugin of this.plugins.validate) {
      nodes = plugin(nodes)
    }

    // Transform the node tree
    for (const plugin of this.plugins.transform) {
      nodes = plugin(nodes)
    }

    return nodes as AST.Node[]
  }

  public static parse(input: string): AST.Node[] {
    if (!Parser.instance) {
      Parser.instance = new Parser()
    }

    return Parser.instance.parse(input)
  }
}
