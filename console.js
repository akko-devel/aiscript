import { Interpreter, Parser, Utils } from '@akkohq/aiscript'
import * as readline from 'readline/promises'
import chalk from 'chalk'

const { valToString } = Utils

const i = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log(`Welcome to AiScript!

Type \`exit\` to end this session.`)

const getInterpreter = () => new Interpreter({}, {
  err(err) {
    console.log(chalk.red(`${err}`))
  },
  in(q) {
    return i.question(`${q}: `)
  },
  log(type, params) {
    switch (type) {
      case 'end':
        console.log(chalk.gray(`< ${valToString(params.val, true)}`))

        break
      default:
        break
    }
  },
  out(value) {
    if (value.type === 'str') {
      console.log(chalk.magenta(value.value))
    } else {
      console.log(chalk.magenta(valToString(value)))
    }
  }
})

let interpreter

async function main() {
  let a = await i.question('> ')

  interpreter?.abort()

  if (a === 'exit') { return false }

  try {
    let ast = Parser.parse(a)
    interpreter = getInterpreter()

    await interpreter.exec(ast)
  } catch (err) {
    console.log(chalk.red(`${err}`))
  }

  return true
}

while (await main());

i.close()
