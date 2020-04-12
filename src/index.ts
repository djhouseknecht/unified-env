import { validateExpectedVariables, finalTypesMatch, joinArray } from './utils/utils';
import {
  LogLevel,
  EnvOptionsObject,
  SimpleEnvReturnObject,
  ISimpleEnvOptions,
  IFileOptions,
  IObjectOfStings,
  TieBreakers,
  SimpleEnvErrorObject,
  EnvOption
} from './utils/interfaces';
import {
  LOG_LEVELS,
  LIB_NAME,
  validateConfigOptions,
  parseEnvFile,
  parseArgv,
  isEnvOptionObject
} from './utils/utils';

type TieBreakerParams = {
  key: string;
  from: string;
  expectedVariable: true | EnvOption;
}

type ParseVariableParams = {
  key: string;
  value: string;
  expectedVariable: EnvOption;
}

export class SimpleEnv<T extends EnvOptionsObject, A> {
  private _expectedEnvVariables: T;
  private _returnConfig: SimpleEnvReturnObject<T> = {} as any;
  private _errors: SimpleEnvErrorObject<T> = {} as any;
  private _simpleEnvOptions: ISimpleEnvOptions;
  private _hasGeneratedConfig: boolean = false;

  constructor (expectedEnvVariables: T, configOptions: Partial<ISimpleEnvOptions> = {}) {
    const defaultConfigOptions: ISimpleEnvOptions = {
      logLevel: 'warn',
      logger: console,
      // requireOrder: ['dev', 'test', 'prod'],
      // orderField: 'ENV'
    };

    /* set and validate _expectedEnvVariables */
    this._expectedEnvVariables = expectedEnvVariables;
    validateExpectedVariables(this._expectedEnvVariables);

    /* set and validate _simpleEnvOptions */
    this._simpleEnvOptions = Object.assign(defaultConfigOptions, configOptions);
    this._simpleEnvOptions.logLevel = this._simpleEnvOptions.logLevel.toLocaleLowerCase() as LogLevel;

    validateConfigOptions(this._simpleEnvOptions);
    this._log('debug', 'constructed with config options', this._simpleEnvOptions);
    this._log('debug', 'expecting variables', this._expectedEnvVariables);
  }

  public env (): this {
    this._log('debug', 'start: parsing process.env variables');
    this._loopThroughResults('env', process.env);
    this._log('debug', 'end: parsing process.env variables');
    return this;
  }

  public argv (): this {
    this._log('debug', 'start: parsing process.argv variables');
    const argv = parseArgv.call(this, process.argv.slice(2));
    this._loopThroughResults('argv', argv);
    this._log('debug', 'end: parsing process.argv variables');
    return this;
  }

  public file (fileOptions?: Partial<IFileOptions>): this {
    this._log('debug', 'start: parsing env-file variables');
    const defaultFileOptions: IFileOptions = {
      filePath: '.env',
      encoding: 'utf-8'
    };
    fileOptions = Object.assign(defaultFileOptions, fileOptions);

    const parsed: IObjectOfStings = parseEnvFile.call(this, fileOptions as IFileOptions);
    this._loopThroughResults('file', parsed);

    this._log('debug', 'end: parsing env-file variables');
    return this;
  }

  public generate (): Readonly<SimpleEnvReturnObject<T>> {
    this._log('info', 'generating config');

    if (this._hasGeneratedConfig) {
      this._log('warn',
        'configuration already generated. ' +
        'Generating the configuration again can cause difficult to track bugs ' +
        'throughout the application.' +
        '\n\tTry rewritting your code to only generate the configuration once ' +
        'as close to app start up as possible.');
    }

    // validate we have all the variables we require
    for (const key in this._expectedEnvVariables) {
      if (!this._expectedEnvVariables.hasOwnProperty(key)) {
        continue;
      }

      const expectedVar = this._expectedEnvVariables[key];

      /* if the value does not exist */
      if (this._returnConfig[key] === undefined) {
        /* if we have a defaultValue, add it */
        if (
          isEnvOptionObject(expectedVar) &&
          expectedVar.defaultValue !== undefined
        ) {
          this._addValueToConfig(key, expectedVar.defaultValue as string, '__defaultValue');
          /* else, is the missing -- is it required? */
        } else if (
          !isEnvOptionObject(expectedVar) ||
          expectedVar.required
        ) {
          this._addErrorMessage(key, 'Missing required variable.');
          /* else we don't have the variable, but it wasn't required */
        } else {
          this._log('info', `Missing "${key}" variable. Variable was not required`);
        }
      }

      /* if we dont' have the value set at this point, stop processing it */
      const varValue = this._returnConfig[key];
      if (varValue === undefined) {
        continue;
      }

      /* if we have acceptableValues, we need to check */
      if (
        isEnvOptionObject(expectedVar) &&
        Array.isArray(expectedVar.acceptableValues)
      ) {
        const hasAcceptableValue = expectedVar.acceptableValues.some(av => av === varValue);

        if (!hasAcceptableValue) {
          // this._addErrorMessage(key, `Does not have an acceptable value. ` +
          //   `Acceptable values are: "${expectedVar.acceptableValues.join('", "')}"`);
          this._addErrorMessage(key, `Does not have an acceptable value. ` +
            `Acceptable values are: ${joinArray(expectedVar.acceptableValues)}`);
        }
      }

      /* lastly, let's double check to make sure the types match up */
      if (!finalTypesMatch(varValue, expectedVar)) {
        this._addErrorMessage(key, 'Value type does not match expected variable return type');
      }
    }

    /* if we have errors, throw */
    if (Object.keys(this._errors)[0] !== undefined) {
      this._log('error', 'Errors', this._errors);
      throw new Error(`${LIB_NAME}: Errors occurred - see log messages for details`);
    }

    this._hasGeneratedConfig = true;
    this._log('info', 'generated config');
    this._log('debug', 'returned config', this._returnConfig);
    return this._returnConfig;
  }

  private _log (level: LogLevel, ...args: any[]): void {
    if (LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this._simpleEnvOptions.logLevel)) {
      this._simpleEnvOptions.logger[level](`${LIB_NAME}:`, ...args);
    }
  }

  private _loopThroughResults (
    from: TieBreakers,
    results: IObjectOfStings
  ): void {
    for (const key in this._expectedEnvVariables) {
      if (this._expectedEnvVariables.hasOwnProperty(key) && results[key]) {
        this._log('debug', `found key "${key}" in ${from}`);
        this._addValueToConfig(key, results[key], from);
      }
    }
  }

  private _addValueToConfig (key: string, value: string, from: TieBreakers): void {
    /**
     * if the item exists
     *  if no tie breaker - log and return
     *  if tie breaker - test tie breaker
     *    if breaker passes, overwrite value
     * parse the value if necessary
     * add to returned config
     */
    const expectedVariable = this._expectedEnvVariables[key];

    /* if the variable was not in the constructor, we aren't adding it */
    if (!expectedVariable) {
      this._log('warn', `key "${key}" was not found in the expected variables. Make sure it is added in the ${LIB_NAME} constructor. ` +
        `Not adding value to returned ${LIB_NAME} config.`);
      return;
    }


    /* if the value is already set on the returning config */
    if (this._returnConfig[key] !== undefined) {
      const tieBreaker = this._preformTieBreaker({ expectedVariable, key, from });
      if (!tieBreaker) {
        this._log('info', `key "${key}" already has value: "${this._returnConfig[key]}" - not setting to the new value: "${value}" from "${from}"`);
        return;
      }
      this._log('info', `key "${key}" already has value: "${this._returnConfig[key]}" - tieBreaker passed for incoming value. ` +
        `Overwritting with the new value: "${value}" from "${from}"`);
    }

    /* if the expected Var is set to boolean 'true' ||
        return type is undefined ||
        return type is String
      we can set the value and return */
    if (
      !isEnvOptionObject(expectedVariable) ||
      !expectedVariable.type ||
      expectedVariable.type === String
    ) {
      return this._setReturnedConfigValue(key, value);
    }

    /* we are going to parse to boolean or number */
    let newValue: boolean | number;
    try {
      newValue = this._parseExpectedVariable({ expectedVariable, key, value });
    } catch (err) {
      this._log('error', err.message);
      this._log('warn', `key "${key}" had a parsing error. Not setting in config.`);
      this._addErrorMessage(key, err.message);
      return;
    }

    /* if we made it here, parsing went well so we can set the value */
    return this._setReturnedConfigValue(key, newValue);
  }

  private _preformTieBreaker (tieBreakerParams: TieBreakerParams): boolean {
    const { expectedVariable, key, from } = tieBreakerParams;

    /* if we don't have a tie breaker, return false */
    if (!isEnvOptionObject(expectedVariable) || !expectedVariable.tieBreaker) {
      this._log('debug', `incoming key "${key}" did not have a tie breaker`);
      return false;
    }

    /* if the tie breaker doesn't match where the variable is coming from, return false */
    if (expectedVariable.tieBreaker !== from) {
      this._log('debug', `incoming key "${key}" did not pass the tieBreaker. ` +
        `Winning tieBreaker "${expectedVariable.tieBreaker}", incoming key's tieBreaker "${from}"`);
      return false;
    }

    /* if the tie breaker passed, return true */
    return true;
  }

  private _parseExpectedVariable (parseVaribleParam: ParseVariableParams): number | boolean {
    const { expectedVariable, value, key } = parseVaribleParam;
    let newValue: boolean | number;

    /* parse booleans */
    if (expectedVariable.type === Boolean) {
      newValue = value === 'true'
        ? true
        : value === 'false'
          ? false
          : undefined;
      if (newValue === undefined) {
        throw new Error(`Failed to parse "${key}" to a boolean. Received value "${value}"`);
      }
      /* parse numbers */
    } else if (expectedVariable.type === Number) {
      newValue = parseFloat(value);
      if (Number.isNaN(newValue)) {
        throw new Error(`Failed to parse { ${key}: "${value}" } to a number`);
      }
    } else {
      throw new Error(`unexcepted variable type: ${expectedVariable.type}`);
    }

    /* if we had a previous error, clear it */
    if (this._errors[key]) {
      delete this._errors[key];
    }

    return newValue;
  }

  private _setReturnedConfigValue (key: string, value: string | boolean | number): void {
    const val = {};
    val[key] = value;
    this._log('info', 'setting config variable:', JSON.stringify(val));
    (this._returnConfig[key] as any) = value;
  }

  private _addErrorMessage (key: keyof T, errMessage: string): void {
    if (!this._errors[key]) {
      this._errors[key] = [];
    }
    console.log('this._errors', this._errors);

    this._errors[key].push(errMessage);
  }
}
