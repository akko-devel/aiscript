import { Parser } from '@akkohq/aiscript'
import * as fs from 'fs'

const script = fs.readFileSync('./test.is', 'utf-8')

const ast = Parser.parse(script)

console.log(JSON.stringify(ast, null, 2))
