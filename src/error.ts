export abstract class AiScriptError extends Error {
  public info?: any

  // `name` is read by `Error.prototype.toString`
  public name = 'AiScript'

  constructor(message: string, info?: any) {
    super(message)

    this.info = info

    // Maintains proper stack trace for where our error was thrown (only
    // available on V8)
    if (Error.captureStackTrace as any) {
      Error.captureStackTrace(this, AiScriptError)
    }
  }
}

/** A wrapper for interpret-time errors */
export class AiScriptRuntimeError extends AiScriptError {
  public name = 'Runtime'

  constructor(message: string, info?: any) {
    super(message, info)
  }
}

/** A wrapper for parse-time errors */
export class AiScriptSyntaxError extends AiScriptError {
  public name = 'Syntax'

  constructor(message: string, info?: any) {
    super(message, info)
  }
}

/** A wrapper for type validation errors */
export class AiScriptTypeError extends AiScriptError {
  public name = 'Type'

  constructor(message: string, info?: any) {
    super(message, info)
  }
}

/** A wrapper for non-AiScript errors */
export class NonAiScriptError extends AiScriptError {
  public name = 'Internal'

  constructor(error: any) {
    super(error.message ?? `${error}`, error)
  }
}

// I hate putting this out of alphabetical order, but TypeScript will complain
// about it otherwise...
/** A runtime error for illegal access to arrays */
export class AiScriptIndexOutOfRangeError extends AiScriptRuntimeError {
  constructor(message: string, info?: any) {
    super(message, info)
  }
}
