import * as fs from 'fs';
import * as path from 'path';
import { IUnifiedEnvOptions, LogLevel, IFileOptions, IObjectOfStings, ILogger, IEnvOption, IEnvOptionsObject } from './interfaces';
import { UnifiedEnv } from '../index';

export const LOG_LEVELS: LogLevel[] = ['log', 'debug', 'info', 'warn', 'error'];
export const LIB_NAME = 'UnifiedEnv';

export function isEnvOptionObject (option: IEnvOption | boolean): option is IEnvOption {
  return typeof option === 'object';
}

export function validateConfigOptions (options: IUnifiedEnvOptions): void {
  const errors: string[] = [];
  let validLogger = true;

  if (!LOG_LEVELS.includes(options.logLevel)) {
    errors.push(`logLevel: ${options.logLevel}`);
  }

  const l = options.logger;
  if (
    typeof l.debug !== 'function' ||
    typeof l.error !== 'function' ||
    typeof l.info !== 'function' ||
    typeof l.log !== 'function' ||
    typeof l.warn !== 'function'
  ) {
    errors.push(`logger does not match the expected interface`);
    validLogger = false;
  }

  // if (typeof options.orderField !== 'string') {
  //   errors.push(`orderField must be of type string`);
  // }

  // if (!Array.isArray(options.requireOrder)) {
  //   errors.push(`requireOrder must be of type array`);
  // }

  if (errors.length) {
    // if we have a valid logger, we can use it
    // otherwise, we need to use the console
    const logger = validLogger ? options.logger : console;
    const err = `${LIB_NAME}: errors - ${errors.join(', ')}`;

    logger.log(`*********${LIB_NAME}*********`);
    logger.log('ERROR: ConfigOptions are invalid.');
    logger.log(err);

    throw new Error(err);
  }
}

export function parseEnvFile (this: UnifiedEnv<any, any>, fileOptions: IFileOptions): IObjectOfStings {

  const NEWLINE = '\n'
  const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
  const RE_NEWLINES = /\\n/g
  const NEWLINES_MATCH = /\n|\r|\r\n/
  const results = {}
  const filePath = path.resolve(process.cwd(), fileOptions.filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Cannot find file: ${filePath}`);
  }

  const src = fs.readFileSync(filePath, { encoding: fileOptions.encoding || 'utf-8' });

  src.toString().split(NEWLINES_MATCH).forEach((line, index) => {
    const keyValueMatch = line.match(RE_INI_KEY_VAL);

    if (keyValueMatch != null) {
      const key = keyValueMatch[1];

      // default undefined or missing values to empty string
      let value = (keyValueMatch[2] || '');
      const end = value.length - 1;
      const isDoubleQuoted = value[0] === '"' && value[end] === '"';
      const isSingleQuoted = value[0] === '\'' && value[end] === '\'';

      // if single or double quoted, remove quotes
      if (isSingleQuoted || isDoubleQuoted) {
        value = value.substring(1, end);

        // if double quoted, expand newlines
        if (isDoubleQuoted) {
          value = value.replace(RE_NEWLINES, NEWLINE);
        }
      } else {
        // remove surrounding whitespace
        value = value.trim();
      }

      results[key] = value;
    } else {
      this['_log']('debug', `did not match key and value when parsing line ${index + 1}: ${line}`)
    }
  });

  return results;
}

export function parseArgv (this: UnifiedEnv<any, any>, argv: string[]): IObjectOfStings {
  let lastKey = '';
  const results: IObjectOfStings = argv.reduce((resObj, curVal, index) => {

    // if we have a new key, set it
    if (curVal.startsWith('--') && curVal !== '--') {
      const key = curVal.substr(2).trim();
      // if the key already exists, log a warning
      if (typeof resObj[key] !== 'undefined') {
        this['_log']('warn', `argv key "${key}" already exists. Overwriting initial value. \nThis happens when two argv keys are identical.\nExample: \`node index.js --DEV=true --DEV=false\`\nThe last argument will be used`);
      }

      // if the last key does not have a value
      if (lastKey && !resObj[lastKey]) {
        this['_log']('debug', `argv "${resObj[lastKey]}" did not have a value. Setting to "true".`);
        resObj[lastKey] = 'true';
      }



      // if the value was not --env=value, then we return
      //  otherwise, we need to let the rest of tthe function run
      const res = key.split('=');
      // set the key
      lastKey = res[0].trim();
      resObj[lastKey] = '';

      if (res.length === 1) {
        return resObj;
      }

      curVal = res[1].trim();
    }

    // the curVal wasn't a key, so add it to the last key
    // if the last key doesn't exist, log a warning
    if (!lastKey) {
      this['_log']('warn', `argv value "${curVal}" is not a key value and does not proceed a key. Ignoring value`);
    } else { // we have a previous key
      resObj[lastKey] += ` ${curVal}`;
    }

    return resObj;
  }, {});

  // trim whitespace and quotes
  Object.keys(results).forEach(key => {
    let value = results[key].trim();

    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith('\'') && value.endsWith('\'');

    if (isDoubleQuoted || isSingleQuoted) {
      value = value.substring(1, value.length - 1);
    }

    results[key] = value;
  });

  this['_log']('debug', 'argv results', results);

  return results;
}

export function validateExpectedVariables<Obj extends IEnvOptionsObject> (variables: Obj): void {
  // TODO: write this
  // throw new Error('Write this')
  // validate that the default value lines up with type
  // validate true or EvnOptionsObject
  // validate acceptableValues are the same type
  // validate tieBreaker
}

export function finalTypesMatch (value: string | number | boolean, expectedVariable: IEnvOption | true): boolean {
  // TODO: write this
  return true;
}

export function joinArray (arr: (string | number | boolean)[]): string {
  let str = '';

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];

    if (typeof element === 'string') {
      str += `"${element}"`;
    } else {
      str += `${element}`;
    }

    if (i !== (arr.length - 1)) {
      str += ', ';
    }

  }

  return str;
}
