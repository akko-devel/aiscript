/* eslint-disable prefer-const */

import { AST, Errors, Interpreter, Parser, Utils } from '../src'
import * as Values from '../src/interpreter/value'
import * as assert from 'assert'

let { AiScriptIndexOutOfRangeError, AiScriptRuntimeError } = Errors

const eq = (a: any, b: any) => {
  assert.deepEqual(a.type, b.type)
  assert.deepEqual(a.value, b.value)
}

const exe = (program: string) => new Promise<Values.Value>((res, rej) => {
  const aiscript = new Interpreter({}, {
    maxStep: 9999,
    out(value) {
      res(value)
    }
  })

  const parser = new Parser()

  const ast = parser.parse(program)

  aiscript.exec(ast).catch(rej)
})

const getMeta = (program: string) => {
  const parser = new Parser()

  const ast = parser.parse(program)
  const metadata = Interpreter.collectMetadata(ast)

  return metadata
}

test.concurrent('Hello, World!', async () => {
  const res = await exe('<: \'Hello, World!\'')

  eq(res, Values.STR('Hello, World!'))
})

test.concurrent('empty script', async () => {
  const parser = new Parser()

  const ast = parser.parse('')

  assert.deepEqual(ast, [])
})

describe('Interpreter', () => {
  describe('Scope', () => {
    test.concurrent('getAll', async () => {
      const aiscript = new Interpreter({})

      await aiscript.exec(
        Parser.parse(
          `let a = 1

          @b() {
            let x = a + 1

            x
          }

          if true {
            var y = 2
          }

          var c = true`
        )
      )

      const vars = aiscript.scope.getAll()

      assert.ok(!!vars.get('a'))
      assert.ok(!!vars.get('b'))
      assert.ok(!!vars.get('c'))
      assert.ok(!vars.get('x'))
      assert.ok(!vars.get('y'))
    })
  })
})

describe('error handler', () => {
  test.concurrent('error from outside caller', async () => {
    let errCount = 0
    let outsideCaller = async () => {}

    const aiscript = new Interpreter(
      {
        emitError: Values.FN_NATIVE((_args, _opts) => {
          throw new Error('emitError')
        }),
        generateOutsideCaller: Values.FN_NATIVE(([fn], opts) => {
          Utils.assertFunction(fn)

          outsideCaller = async () => {
            opts.topCall(fn, [])
          }
        })
      },
      {
        err(_err) {
          errCount++
        }
      }
    )

    await aiscript.exec(Parser.parse('generateOutsideCaller(emitError)'))

    assert.strictEqual(errCount, 0)

    await outsideCaller()

    assert.strictEqual(errCount, 1)
  })

  test.concurrent('array.map calls the handler just once', async () => {
    let errCount = 0

    const aiscript = new Interpreter({}, {
      err(_err) {
        errCount++
      }
    })

    await aiscript.exec(
      Parser.parse('Core:range(1, 5).map(@() { hoge })')
    )

    assert.strictEqual(errCount, 1)
  })
})

describe('ops', () => {
  test.concurrent('==', async () => {
    eq(await exe('<: (1 == 1)'), Values.BOOL(true))
    eq(await exe('<: (1 == 2)'), Values.BOOL(false))
  })

  test.concurrent('!=', async () => {
    eq(await exe('<: (1 != 2)'), Values.BOOL(true))
    eq(await exe('<: (1 != 1)'), Values.BOOL(false))
  })

  test.concurrent('&&', async () => {
    eq(await exe('<: (true && true)'), Values.BOOL(true))
    eq(await exe('<: (true && false)'), Values.BOOL(false))
    eq(await exe('<: (false && true)'), Values.BOOL(false))
    eq(await exe('<: (false && false)'), Values.BOOL(false))
    eq(await exe('<: (false && null)'), Values.BOOL(false))

    try {
      await exe('<: (true && null)')
    } catch (err) {
      assert.ok(err instanceof AiScriptRuntimeError)

      return
    }

    eq(
      await exe(
        `var tmp = null

        @func() {
          tmp = true

          return true
        }

        false && func()

        <: tmp`
      ),
      Values.NULL
    )

    eq(
      await exe(
        `var tmp = null

        @func() {
          tmp = true

          return true
        }

        true && func()

        <: tmp`
      ),
      Values.BOOL(true)
    )

    assert.fail()
  })

  test.concurrent('||', async () => {
    eq(await exe('<: (true || true)'), Values.BOOL(true))
    eq(await exe('<: (true || false)'), Values.BOOL(true))
    eq(await exe('<: (false || true)'), Values.BOOL(true))
    eq(await exe('<: (false || false)'), Values.BOOL(false))
    eq(await exe('<: (true || null)'), Values.BOOL(true))

    try {
      await exe('<: (false || null)')
    } catch (err) {
      assert.ok(err instanceof AiScriptRuntimeError)

      return
    }

    eq(
      await exe(
        `var tmp = null

        @func() {
          tmp = true

          return true
        }

        true || func()

        <: tmp`
      ),
      Values.NULL
    )

    eq(
      await exe(
        `var tmp = null

        @func() {
          tmp = true

          return true
        }

        false || func()

        <: tmp`
      ),
      Values.BOOL(true)
    )

    assert.fail()
  })

  test.concurrent('+', async () => {
    eq(await exe('<: (1 + 1)'), Values.NUM(2))
  })

  test.concurrent('-', async () => {
    eq(await exe('<: (1 - 1)'), Values.NUM(0))
  })

  test.concurrent('*', async () => {
    eq(await exe('<: (1 * 1)'), Values.NUM(1))
  })

  test.concurrent('^', async () => {
    eq(await exe('<: (1 ^ 0)'), Values.NUM(1))
  })

  test.concurrent('/', async () => {
    eq(await exe('<: (1 / 1)'), Values.NUM(1))
  })

  test.concurrent('%', async () => {
    eq(await exe('<: (1 % 1)'), Values.NUM(0))
  })

  test.concurrent('>', async () => {
    eq(await exe('<: (2 > 1)'), Values.BOOL(true))
    eq(await exe('<: (1 > 1)'), Values.BOOL(false))
    eq(await exe('<: (0 > 1)'), Values.BOOL(false))
  })

  test.concurrent('<', async () => {
    eq(await exe('<: (2 < 1)'), Values.BOOL(false))
    eq(await exe('<: (1 < 1)'), Values.BOOL(false))
    eq(await exe('<: (0 < 1)'), Values.BOOL(true))
  })

  test.concurrent('>=', async () => {
    eq(await exe('<: (2 >= 1)'), Values.BOOL(true))
    eq(await exe('<: (1 >= 1)'), Values.BOOL(true))
    eq(await exe('<: (0 >= 1)'), Values.BOOL(false))
  })

  test.concurrent('<=', async () => {
    eq(await exe('<: (2 <= 1)'), Values.BOOL(false))
    eq(await exe('<: (1 <= 1)'), Values.BOOL(true))
    eq(await exe('<: (0 <= 1)'), Values.BOOL(true))
  })

  test.concurrent('precedence', async () => {
    eq(await exe('<: 1 + 2 * 3 + 4'), Values.NUM(11))
    eq(await exe('<: 1 + 4 / 4 + 1'), Values.NUM(3))
    eq(await exe('<: 1 + 1 == 2 && 2 * 2 == 4'), Values.BOOL(true))
    eq(await exe('<: (1 + 1) * 2'), Values.NUM(4))
  })

  test.concurrent('negative numbers', async () => {
    eq(await exe('<: 1+-1'), Values.NUM(0))
    eq(await exe('<: 1--1'), Values.NUM(2))
    eq(await exe('<: -1*-1'), Values.NUM(1))
    eq(await exe('<: -1==-1'), Values.BOOL(true))
    eq(await exe('<: 1>-1'), Values.BOOL(true))
    eq(await exe('<: -1<1'), Values.BOOL(true))
  })

  // TODO: copy over the rest of the tests from the original repository
})
