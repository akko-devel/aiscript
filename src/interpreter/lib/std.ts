import { AiScriptRuntimeError } from '../../error.js'
import { textDecoder } from '../../const.js'
import * as Values from '../value.js'
import * as Utils from '../utils.js'
import seedrandom from 'seedrandom'
import { v4 as uuid } from 'uuid'

export const std: Record<string, Values.Value> = {
  //#region Async
  'Async:interval': Values.FN_NATIVE(
    async ([interval, callback, immediate], opts) => {
      Utils.assertFunction(callback)
      Utils.assertNumber(interval)

      if (immediate) {
        Utils.assertBoolean(immediate)

        if (immediate.value) { opts.call(callback, []) }
      }

      const id = setInterval(
        () => {
          opts.topCall(callback, [])
        },
        interval.value
      )

      const abortHandler = () => {
        clearInterval(id)
      }

      opts.registerAbortHandler(abortHandler)

      // Stopper
      return Values.FN_NATIVE(([], opts) => {
        clearInterval(id)

        opts.unregisterAbortHandler(abortHandler)
      })
    }
  ),
  'Async:timeout': Values.FN_NATIVE(async ([delay, callback], opts) => {
    Utils.assertFunction(callback)
    Utils.assertNumber(delay)

    const id = setTimeout(
      () => {
        opts.topCall(callback, [])
      },
      delay.value
    )

    const abortHandler = () => {
      clearTimeout(id)
    }

    opts.registerAbortHandler(abortHandler)

    // Stopper
    return Values.FN_NATIVE(([], opts) => {
      clearTimeout(id)

      opts.unregisterAbortHandler(abortHandler)
    })
  }),
  //#endregion

  //#region Core
  'Core:ai': Values.STR('kawaii'),
  'Core:add': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(a.value + b.value)
  }),
  'Core:and': Values.FN_NATIVE(([a, b]) => {
    Utils.assertBoolean(a)

    if (!a.value) { return Values.FALSE }

    Utils.assertBoolean(b)

    return b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:div': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    const res = a.value / b.value

    if (isNaN(res)) {
      throw new AiScriptRuntimeError('invalid operation')
    }

    return Values.NUM(res)
  }),
  'Core:eq': Values.FN_NATIVE(([a, b]) => {
    Utils.expectAny(a)
    Utils.expectAny(b)

    return Utils.eq(a, b) ? Values.TRUE : Values.FALSE
  }),
  'Core:gt': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return a.value > b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:gteq': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return a.value >= b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:lt': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return a.value < b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:lteq': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return a.value <= b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:mod': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(a.value % b.value)
  }),
  'Core:mul': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(a.value * b.value)
  }),
  'Core:neq': Values.FN_NATIVE(([a, b]) => {
    Utils.expectAny(a)
    Utils.expectAny(b)

    return Utils.eq(a, b) ? Values.FALSE : Values.TRUE
  }),
  'Core:not': Values.FN_NATIVE(([a]) => {
    Utils.assertBoolean(a)

    return a.value ? Values.FALSE : Values.TRUE
  }),
  'Core:or': Values.FN_NATIVE(([a, b]) => {
    Utils.assertBoolean(a)

    if (a.value) { return Values.TRUE }

    Utils.assertBoolean(b)

    return b.value ? Values.TRUE : Values.FALSE
  }),
  'Core:pow': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    const res = a.value ** b.value

    if (isNaN(res)) {
      throw new AiScriptRuntimeError('invalid operation')
    }

    return Values.NUM(res)
  }),
  'Core:range': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    if (a.value < b.value) {
      return Values.ARR(
        Array.from(
          {
            length: (b.value - a.value) + 1
          },
          (_, i) => Values.NUM(a.value + i)
        )
      )
    } else if (a.value > b.value) {
      return Values.ARR(
        Array.from(
          {
            length: (a.value - b.value) + 1
          },
          (_, i) => Values.NUM(a.value - i)
        )
      )
    } else {
      return Values.ARR([a])
    }
  }),
  'Core:sleep': Values.FN_NATIVE(async ([delay]) => {
    Utils.assertNumber(delay)

    await new Promise(res => setTimeout(res, delay.value))

    return Values.NULL
  }),
  'Core:sub': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(a.value - b.value)
  }),
  'Core:to_str': Values.FN_NATIVE(([v]) => {
    Utils.expectAny(v)

    return Values.STR(Utils.reprValue(v))
  }),
  'Core:type': Values.FN_NATIVE(([v]) => {
    Utils.expectAny(v)

    return Values.STR(v.type)
  }),
  'Core:version': Values.STR('14.0.0'),
  //#endregion

  //#region Date
  'Date:day': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getDate())
  }),
  'Date:hour': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getHours())
  }),
  'Date:minute': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getMinutes())
  }),
  'Date:month': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getMonth() + 1)
  }),
  'Date:now': Values.FN_NATIVE(() => {
    return Values.NUM(Date.now())
  }),
  'Date:parse': Values.FN_NATIVE(([v]) => {
    Utils.assertString(v)

    return Values.NUM(new Date(v.value).getTime())
  }),
  'Date:second': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getSeconds())
  }),
  'Date:year': Values.FN_NATIVE(([v]) => {
    if (v) { Utils.assertNumber(v) }

    return Values.NUM(new Date(v?.value || Date.now()).getFullYear())
  }),
  //#endregion

  //#region Error
  'Error:create': Values.FN_NATIVE(([name, info]) => {
    Utils.assertString(name)

    return Values.ERROR(name.value, info)
  }),
  //#endregion

  help: Values.STR(
    '@see https://github.com/akko-devel/aiscript/blob/develop/docs/get-started.md'
  ),

  //#region JSON
  'JSON:parsable': Values.FN_NATIVE(([str]) => {
    Utils.assertString(str)

    try {
      JSON.parse(str.value)
    } catch (err) {
      return Values.FALSE
    }

    return Values.TRUE
  }),
  'JSON:parse': Values.FN_NATIVE(([json]) => {
    Utils.assertString(json)

    try {
      return Utils.jsToVal(JSON.parse(json.value))
    } catch (err) {
      return Values.ERROR('not_json')
    }
  }),
  'JSON:stringify': Values.FN_NATIVE(([v]) => {
    Utils.expectAny(v)

    return Values.STR(JSON.stringify(Utils.valToJs(v)))
  }),
  //#endregion

  //#region Math
  'Math:abs': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.abs(v.value))
  }),
  'Math:acos': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.acos(v.value))
  }),
  'Math:acosh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.acosh(v.value))
  }),
  'Math:asin': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.asin(v.value))
  }),
  'Math:asinh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.asinh(v.value))
  }),
  'Math:atan': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.atan(v.value))
  }),
  'Math:atan2': Values.FN_NATIVE(([y, x]) => {
    Utils.assertNumber(x)
    Utils.assertNumber(y)

    return Values.NUM(Math.atan2(y.value, x.value))
  }),
  'Math:atanh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.atanh(v.value))
  }),
  'Math:cbrt': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.cbrt(v.value))
  }),
  'Math:ceil': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.ceil(v.value))
  }),
  'Math:clz32': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.clz32(v.value))
  }),
  'Math:cos': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.cos(v.value))
  }),
  'Math:cosh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.cosh(v.value))
  }),
  'Math:E': Values.NUM(Math.E),
  'Math:exp': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.exp(v.value))
  }),
  'Math:expm1': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.expm1(v.value))
  }),
  'Math:floor': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.floor(v.value))
  }),
  'Math:fround': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.fround(v.value))
  }),
  'Math:gen_rng': Values.FN_NATIVE(([seed]) => {
    Utils.expectAny(seed)

    if (seed.type !== 'num' && seed.type !== 'str') { return Values.NULL }

    const rng = seedrandom(seed.value.toString())

    return Values.FN_NATIVE(([min, max]) => {
      if (min && min.type === 'num' && max && max.type === 'num') {
        return Values.NUM(Math.floor(
          rng()
            * (Math.floor(max.value) - Math.ceil(min.value) + 1)
            + Math.ceil(min.value)
        ))
      }

      return Values.NUM(rng())
    })
  }),
  'Math:hypot': Values.FN_NATIVE(([vs]) => {
    Utils.assertArray(vs)

    const values = [] as number[]

    for (const v of vs.value) {
      Utils.assertNumber(v)

      values.push(v.value)
    }

    return Values.NUM(Math.hypot(...values))
  }),
  'Math:imul': Values.FN_NATIVE(([x, y]) => {
    Utils.assertNumber(x)
    Utils.assertNumber(y)

    return Values.NUM(Math.imul(x.value, y.value))
  }),
  'Math:Infinity': Values.NUM(Infinity),
  'Math:log': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.log(v.value))
  }),
  'Math:log10': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.log10(v.value))
  }),
  'Math:log1p': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.log1p(v.value))
  }),
  'Math:log2': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.log2(v.value))
  }),
  'Math:LN10': Values.NUM(Math.LN10),
  'Math:LN2': Values.NUM(Math.LN2),
  'Math:LOG10E': Values.NUM(Math.LOG10E),
  'Math:LOG2E': Values.NUM(Math.LOG2E),
  'Math:max': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(Math.max(a.value, b.value))
  }),
  'Math:min': Values.FN_NATIVE(([a, b]) => {
    Utils.assertNumber(a)
    Utils.assertNumber(b)

    return Values.NUM(Math.min(a.value, b.value))
  }),
  'Math:PI': Values.NUM(Math.PI),
  'Math:pow': Values.FN_NATIVE(([x, y]) => {
    Utils.assertNumber(x)
    Utils.assertNumber(y)

    return Values.NUM(Math.pow(x.value, y.value))
  }),
  'Math:rnd': Values.FN_NATIVE(([min, max]) => {
    if (min && min.type === 'num' && max && max.type === 'num') {
      return Values.NUM(Math.floor(
        Math.random()
          * (Math.floor(max.value) - Math.ceil(min.value) + 1)
          + Math.ceil(min.value)
      ))
    }

    return Values.NUM(Math.random())
  }),
  'Math:round': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.round(v.value))
  }),
  'Math:sign': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.sign(v.value))
  }),
  'Math:sin': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.sin(v.value))
  }),
  'Math:sinh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.sinh(v.value))
  }),
  'Math:sqrt': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    const res = Math.sqrt(v.value)

    if (isNaN(res)) { throw new AiScriptRuntimeError('invalid operation') }

    return Values.NUM(res)
  }),
  'Math:SQRT1_2': Values.NUM(Math.SQRT1_2),
  'Math:SQRT2': Values.NUM(Math.SQRT2),
  'Math:tan': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.tan(v.value))
  }),
  'Math:tanh': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.tanh(v.value))
  }),
  'Math:trunc': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.NUM(Math.trunc(v.value))
  }),
  //#endregion

  //#region Number
  'Num:from_hex': Values.FN_NATIVE(([v]) => {
    Utils.assertString(v)

    return Values.NUM(parseInt(v.value, 16))
  }),
  'Num:to_hex': Values.FN_NATIVE(([v]) => {
    Utils.assertNumber(v)

    return Values.STR(v.value.toString(16))
  }),
  //#endregion

  //#region Object
  'Obj:copy': Values.FN_NATIVE(([obj]) => {
    Utils.assertObject(obj)

    return Values.OBJ(new Map(obj.value))
  }),
  'Obj:get': Values.FN_NATIVE(([obj, key]) => {
    Utils.assertObject(obj)
    Utils.assertString(key)

    return obj.value.get(key.value) ?? Values.NULL
  }),
  'Obj:has': Values.FN_NATIVE(([obj, key]) => {
    Utils.assertObject(obj)
    Utils.assertString(key)

    return Values.BOOL(obj.value.has(key.value))
  }),
  'Obj:keys': Values.FN_NATIVE(([obj]) => {
    Utils.assertObject(obj)

    return Values.ARR(Array.from(obj.value.keys()).map(k => Values.STR(k)))
  }),
  'Obj:kvs': Values.FN_NATIVE(([obj]) => {
    Utils.assertObject(obj)

    return Values.ARR(
      Array.from(obj.value.entries())
        .map(([k, v]) => Values.ARR([Values.STR(k), v]))
    )
  }),
  'Obj:merge': Values.FN_NATIVE(([a, b]) => {
    Utils.assertObject(a)
    Utils.assertObject(b)

    return Values.OBJ(new Map([...a.value, ...b.value]))
  }),
  'Obj:set': Values.FN_NATIVE(([obj, key, value]) => {
    Utils.assertObject(obj)
    Utils.assertString(key)
    Utils.expectAny(value)

    obj.value.set(key.value, value)

    return Values.NULL
  }),
  'Obj:vals': Values.FN_NATIVE(([obj]) => {
    Utils.assertObject(obj)

    return Values.ARR(Array.from(obj.value.values()))
  }),
  //#endregion

  //#region String
  'Str:from_codepoint': Values.FN_NATIVE(([codePoint]) => {
    Utils.assertNumber(codePoint)

    return Values.STR(String.fromCodePoint(codePoint.value))
  }),
  'Str:from_unicode_codepoints': Values.FN_NATIVE(([codePoints]) => {
    Utils.assertArray(codePoints)

    return Values.STR(
      Array.from(
        codePoints.value.map(a => {
          Utils.assertNumber(a)

          return String.fromCodePoint(a.value)
        })
      ).join('')
    )
  }),
  'Str:from_utf8_bytes': Values.FN_NATIVE(([bytes]) => {
    Utils.assertArray(bytes)

    return Values.STR(
      textDecoder.decode(
        Uint8Array.from(
          bytes.value.map(a => {
            Utils.assertNumber(a)

            return a.value
          })
        )
      )
    )
  }),
  'Str:gt': Values.FN_NATIVE(([a, b]) => {
    Utils.assertString(a)
    Utils.assertString(b)

    if (a.value > b.value) {
      return Values.NUM(-1)
    } else if (a.value === b.value) {
      return Values.NUM(0)
    }

    return Values.NUM(1)
  }),
  'Str:lf': Values.STR('\n'),
  'Str:lt': Values.FN_NATIVE(([a, b]) => {
    Utils.assertString(a)
    Utils.assertString(b)

    if (a.value < b.value) {
      return Values.NUM(-1)
    } else if (a.value === b.value) {
      return Values.NUM(0)
    }

    return Values.NUM(1)
  }),
  //#endregion

  //#region Utilities
  'Utils:uuid': Values.FN_NATIVE(() => {
    return Values.STR(uuid())
  })
  //#endregion
}
