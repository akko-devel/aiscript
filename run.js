import { Errors, Interpreter, Parser, Utils } from '@akkohq/aiscript'
import * as readline from 'readline'
import chalk from 'chalk'
import * as fs from 'fs'

const { AiScriptError } = Errors
const { valToString } = Utils

const i = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const interpreter = new Interpreter({}, {
  err(err) {
    console.log(chalk.read(`${err}`))
  },
  in(q) {
    return new Promise(res => {
      i.question(`${q}: `, res)
    })
  },
  log(_type, _params) {
    // TODO
  },
  out(value) {
    console.log(chalk.magenta(valToString(value, true)))
  }
})

const script = fs.readFileSync('./test.is', 'utf-8')

try {
  const ast = Parser.parse(script)

  await interpreter.exec(ast)
} catch (err) {
  if (err instanceof AiScriptError) {
    console.log(chalk.red(`${err}`))
  } else {
    throw err
  }
}

i.close()
