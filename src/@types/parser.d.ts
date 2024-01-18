import type { CST } from '@/index'

declare module '@/parser/parser' {
  // @ts-ignore
  export const parse: (input: string, options: object) => CST.Node[]
}
