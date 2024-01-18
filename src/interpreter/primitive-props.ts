import { indexOf, length, substring, toArray } from 'stringz'
import { AiScriptRuntimeError } from '../error.js'
import { textEncoder } from '../const.js'
import * as Values from './value.js'
import * as Utils from './utils.js'

type VWithPP = Values.VArr | Values.VError | Values.VNum | Values.VStr

const PRIMITIVE_PROPS: {
  [key in VWithPP['type']]: {
    [key: string]: (target: any) => any // FIXME
  }
} = {
  arr: {
    concat: (target: Values.VArr) => Values.FN_NATIVE(async ([x], _opts) => {
      Utils.assertArray(x)

      return Values.ARR(target.value.concat(x.value))
    }),
    copy: (target: Values.VArr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.ARR([...target.value])
    }),
    filter: (target: Values.VArr) => Values.FN_NATIVE(async ([fn], opts) => {
      Utils.assertFunction(fn)

      const vals = [] as Values.Value[]

      for (let i = 0; i < target.value.length; i++) {
        const item = target.value[i]!
        const res = await opts.call(fn, [item, Values.NUM(i)])

        Utils.assertBoolean(res)

        if (res.value) { vals.push(item) }
      }

      return Values.ARR(vals)
    }),
    find: (target: Values.VArr) => Values.FN_NATIVE(async ([fn], opts) => {
      Utils.assertFunction(fn)

      for (let i = 0; i < target.value.length; i++) {
        const item = target.value[i]!
        const res = await opts.call(fn, [item, Values.NUM(i)])

        Utils.assertBoolean(res)

        if (res.value) { return item }
      }

      return Values.NULL
    }),
    incl: (target: Values.VArr) => Values.FN_NATIVE(async ([val], _opts) => {
      Utils.expectAny(val)

      if (
        val.type !== 'str'
          && val.type !== 'num'
          && val.type !== 'bool'
          && val.type !== 'null'
      ) {
        return Values.FALSE
      }

      const getValue = (v: Values.VArr) => {
        return v.value.map(i => {
          if (i.type === 'bool') { return i.value }
          if (i.type === 'null') { return null }
          if (i.type === 'num') { return i.value }
          if (i.type === 'str') { return i.value }

          return Symbol()
        })
      }

      return getValue(target)
        .includes(
          val.type === 'null' ? null : val.value
        ) ? Values.TRUE : Values.FALSE
    }),
    join: (target: Values.VArr) => Values.FN_NATIVE(async ([joiner], _opts) => {
      if (joiner) { Utils.assertString(joiner) }

      return Values.STR(
        target.value
          .map(i => i.type === 'str' ? i.value : '')
          .join(joiner ? joiner.value : '')
      )
    }),
    len: (target: Values.VArr) => Values.NUM(target.value.length),
    map: (target: Values.VArr) => Values.FN_NATIVE(async ([fn], opts) => {
      Utils.assertFunction(fn)

      const vals = target.value.map(async (item, i) => {
        return await opts.call(fn, [item, Values.NUM(i)])
      })

      return Values.ARR(await Promise.all(vals))
    }),
    pop: (target: Values.VArr) => Values.FN_NATIVE(async (_, _opts) => {
      return target.value.pop() ?? Values.NULL
    }),
    push: (target: Values.VArr) => Values.FN_NATIVE(async ([val], _opts) => {
      Utils.expectAny(val)

      target.value.push(val)

      return target
    }),
    reduce: (target: Values.VArr) => Values.FN_NATIVE(
      async ([fn, initialValue], opts) => {
        Utils.assertFunction(fn)

        const withInitialValue = !!initialValue

        let accumulator = withInitialValue ? initialValue : target.value[0]!

        for (let i = withInitialValue ? 0 : 1; i < target.value.length; i++) {
          const item = target.value[i]!

          accumulator = await opts.call(fn, [accumulator, item, Values.NUM(i)])
        }

        return accumulator
      }
    ),
    reverse: (target: Values.VArr) => Values.FN_NATIVE(async (_, _opts) => {
      target.value.reverse()

      return Values.NULL
    }),
    shift: (target: Values.VArr) => Values.FN_NATIVE(async (_, _opts) => {
      return target.value.shift() ?? Values.NULL
    }),
    slice: (target: Values.VArr) => Values.FN_NATIVE(
      async ([begin, end], _opts) => {
        Utils.assertNumber(begin)
        Utils.assertNumber(end)

        return Values.ARR(target.value.slice(begin.value, end.value))
      }
    ),
    sort: (target: Values.VArr) => Values.FN_NATIVE(async ([comp], opts) => {
      const merge = async (
        left: Values.Value[],
        right: Values.Value[],
        comp: Values.VFn
      ) => {
        const result = [] as Values.Value[]

        let leftIndex = 0
        let rightIndex = 0

        while (leftIndex < left.length && rightIndex < right.length) {
          const l = left[leftIndex]!
          const r = right[rightIndex]!

          const compValue = await opts.call(comp, [l, r])

          Utils.assertNumber(compValue)

          if (compValue.value < 0) {
            result.push(left[leftIndex]!)

            leftIndex++
          } else {
            result.push(right[rightIndex]!)

            rightIndex++
          }
        }

        return result.concat(left.slice(leftIndex))
          .concat(right.slice(rightIndex))
      }

      const mergeSort = async (
        arr: Values.Value[],
        comp: Values.VFn
      ): Promise<Values.Value[]> => {
        if (arr.length <= 1) { return arr }

        const mid = Math.floor(arr.length / 2)

        const left = await mergeSort(arr.slice(0, mid), comp)
        const right = await mergeSort(arr.slice(mid), comp)

        return merge(left, right, comp)
      }

      Utils.assertFunction(comp)
      Utils.assertArray(target)

      target.value = await mergeSort(target.value, comp)

      return target
    }),
    unshift: (target: Values.VArr) => Values.FN_NATIVE(async ([val], _opts) => {
      Utils.expectAny(val)

      target.value.unshift(val)

      return target
    })
  },
  error: {
    info: (target: Values.VError) => target.info ?? Values.NULL,
    name: (target: Values.VError) => Values.STR(target.value)
  },
  num: {
    to_str: (target: Values.VNum) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.STR(target.value.toString())
    })
  },
  str: {
    charcode_at: (target: Values.VStr) => Values.FN_NATIVE(([i], _) => {
      Utils.assertNumber(i)

      const res = target.value.charCodeAt(i.value)

      return Number.isNaN(res) ? Values.NULL : Values.NUM(res)
    }),
    codepoint_at: (target: Values.VStr) => Values.FN_NATIVE(([i], _) => {
      Utils.assertNumber(i)

      const res = target.value.codePointAt(i.value)
        ?? target.value.charCodeAt(i.value)

      return Number.isNaN(res) ? Values.NULL : Values.NUM(res)
    }),
    incl: (target: Values.VStr) => Values.FN_NATIVE(
      async ([search], _opts) => {
        Utils.assertString(search)

        return target.value.includes(search.value) ? Values.TRUE : Values.FALSE
      }
    ),
    index_of: (target: Values.VStr) => Values.FN_NATIVE(
      async ([search], _opts) => {
        Utils.assertString(search)

        return Values.NUM(indexOf(target.value, search.value))
      }
    ),
    len: (target: Values.VStr) => Values.NUM(length(target.value)),
    lower: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.STR(target.value.toLowerCase())
    }),
    pick: (target: Values.VStr) => Values.FN_NATIVE(async ([i], _opts) => {
      Utils.assertNumber(i)

      const chars = toArray(target.value)

      const char = chars[i.value]

      return char ? Values.STR(char) : Values.NULL
    }),
    replace: (target: Values.VStr) => Values.FN_NATIVE(
      async ([a, b], _opts) => {
        Utils.assertString(a)
        Utils.assertString(b)

        return Values.STR(target.value.split(a.value).join(b.value))
      }
    ),
    slice: (target: Values.VStr) => Values.FN_NATIVE(
      async ([begin, end], _opts) => {
        Utils.assertNumber(begin)
        Utils.assertNumber(end)

        return Values.STR(substring(target.value, begin.value, end.value))
      }
    ),
    split: (target: Values.VStr) => Values.FN_NATIVE(
      async ([splitter], _opts) => {
        if (splitter) {
          Utils.assertString(splitter)

          return Values.ARR(
            target.value
              .split(splitter ? splitter.value : '')
              .map(s => Values.STR(s))
          )
        }

        return Values.ARR(toArray(target.value).map(s => Values.STR(s)))
      }
    ),
    to_arr: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.ARR(toArray(target.value).map(s => Values.STR(s)))
    }),
    to_char_arr: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.ARR(target.value.split('').map(s => Values.STR(s)))
    }),
    to_charcode_arr: (target: Values.VStr) => Values.FN_NATIVE(
      async (_, _opts) => {
        return Values.ARR(
          target.value.split('').map(s => Values.NUM(s.charCodeAt(0)))
        )
      }
    ),
    to_num: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      const parsed = parseInt(target.value, 10)

      if (isNaN(parsed)) { return Values.NULL }

      return Values.NUM(parsed)
    }),
    to_unicode_arr: (target: Values.VStr) => Values.FN_NATIVE(
      async (_, _opts) => {
        return Values.ARR([...target.value].map(s => Values.STR(s)))
      }
    ),
    to_unicode_codepoint_arr: (target: Values.VStr) => Values.FN_NATIVE(
      async (_, _opts) => {
        return Values.ARR([...target.value].map(s => {
          const res = s.codePointAt(0)

          return Values.NUM(res ?? s.charCodeAt(0))
        }))
      }
    ),
    to_utf8_byte_arr: (target: Values.VStr) => Values.FN_NATIVE(
      async (_, _opts) => {
        return Values.ARR(
          Array.from(textEncoder.encode(target.value)).map(s => Values.NUM(s))
        )
      }
    ),
    trim: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.STR(target.value.trim())
    }),
    upper: (target: Values.VStr) => Values.FN_NATIVE(async (_, _opts) => {
      return Values.STR(target.value.toUpperCase())
    })
  }
}

export function getPrimitiveProp(
  target: Values.Value,
  name: string
): Values.Value {
  if (Object.hasOwn(PRIMITIVE_PROPS, target.type)) {
    const props = PRIMITIVE_PROPS[target.type as VWithPP['type']]

    if (Object.hasOwn(props, name)) {
      return props[name]!(target)
    }

    throw new AiScriptRuntimeError(`no such prop (${name}) in ${target.type}`)
  }

  throw new AiScriptRuntimeError(
    `cannot read prop of ${target.type}. (reading ${name})`
  )
}
