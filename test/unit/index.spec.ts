import {
  IUnifiedEnvOptions,
  ILogger,
  IFileOptions,
  IEnvOptionsObject,
  IEnvOption
} from '../../src/utils/interfaces';
import { UnifiedEnv } from '../../src/index';
import * as utils from '../../src/utils/utils';
import { LIB_NAME } from '../../src/utils/utils';

const spyLogger: ILogger = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const defaultConfigOptions: IUnifiedEnvOptions = {
  logLevel: 'warn',
  logger: console,
  // requireOrder: ['dev', 'test', 'prod'],
  // orderField: 'ENV'
};

describe('UnifiedEnv', () => {
  describe('constructor()', () => {
    test('should set expected env variables and config to default config', () => {
      const envVars = { K: {}, B: {} };
      const config = new UnifiedEnv(envVars);
      expect(config['_unifiedEnvOptions']).toEqual(defaultConfigOptions);
      expect(config['_expectedEnvVariables']).toEqual(envVars);
    });

    test('should lowercase passed in logLevel', () => {
      const config = new UnifiedEnv({}, { logLevel: 'ERROR' as any });
      expect(config['_unifiedEnvOptions'].logLevel).toEqual('error');
    });

    test('should validate config options and expectedEnvVariables', () => {
      const configSpy = jest.spyOn(utils, 'validateConfigOptions');
      const varSpy = jest.spyOn(utils, 'validateExpectedVariables');
      const envVars = { K: {}, B: {} };
      new UnifiedEnv(envVars);
      expect(configSpy).toHaveBeenCalledWith(defaultConfigOptions);
      expect(varSpy).toHaveBeenCalledWith(envVars);
    });

    test('should merge config options with defaults', () => {
      const options: Partial<IUnifiedEnvOptions> = {
        logLevel: 'debug',
        // orderField: 'KTY'
      };
      const env = new UnifiedEnv({}, options);
      expect(env['_unifiedEnvOptions']).toEqual({
        logLevel: 'debug',
        logger: console,
        // requireOrder: ['dev', 'test', 'prod'],
        // orderField: 'KTY'
      });
    });
  });

  describe('env()', () => {
    test('should call _loopThroughResults with process.env variables', () => {
      const unifiedEnv = new UnifiedEnv({});
      const loopSpy = jest.fn();
      const logSpy = jest.fn();
      unifiedEnv['_loopThroughResults'] = loopSpy;
      unifiedEnv['_log'] = logSpy;

      unifiedEnv.env();
      expect(loopSpy).toHaveBeenCalledTimes(1);
      expect(loopSpy).toHaveBeenCalledWith('env', process.env);
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(1, 'debug', 'start: parsing process.env variables');
      expect(logSpy).toHaveBeenNthCalledWith(2, 'debug', 'end: parsing process.env variables');
    });
  });

  describe('argv()', () => {
    test('should call _loopThroughResults for with process.argv', () => {
      const mockArgvReturnObject = {
        LOGGY: 'true',
        BOB: 'false'
      };

      const loopSpy = jest.fn();
      const parseArgvSpy = jest.spyOn(utils, 'parseArgv').mockReturnValue(mockArgvReturnObject);
      const logSpy = jest.fn();
      const unifiedEnv = new UnifiedEnv({});
      unifiedEnv['_loopThroughResults'] = loopSpy;
      unifiedEnv['_log'] = logSpy;

      unifiedEnv.argv();
      expect(loopSpy).toHaveBeenCalledTimes(1);
      expect(loopSpy).toHaveBeenCalledWith('argv', mockArgvReturnObject);
      expect(parseArgvSpy).toHaveBeenCalledWith(process.argv.slice(2));
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(1, 'debug', 'start: parsing process.argv variables');
      expect(logSpy).toHaveBeenNthCalledWith(2, 'debug', 'end: parsing process.argv variables');
    });
  });

  describe('file()', () => {
    test('should call _loopThroughResults with parsed variables from env file', () => {
      const mockEnvFileReturnObject = {
        LOGGY: 'true',
        BOB: 'false'
      };
      const defaultFileOptions: IFileOptions = {
        filePath: '.env',
        encoding: 'utf-8',
        failIfNotFound: false
      };

      const loopSpy = jest.fn();
      const parseEnvFileSpy = jest.spyOn(utils, 'parseEnvFile').mockReturnValue(mockEnvFileReturnObject);
      const logSpy = jest.fn();
      const unifiedEnv = new UnifiedEnv({});
      unifiedEnv['_loopThroughResults'] = loopSpy;
      unifiedEnv['_log'] = logSpy;

      unifiedEnv.file();
      expect(loopSpy).toHaveBeenCalledTimes(1);
      expect(loopSpy).toHaveBeenCalledWith('file', mockEnvFileReturnObject);
      expect(parseEnvFileSpy).toHaveBeenCalledWith(defaultFileOptions);
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(1, 'debug', 'start: parsing env-file variables');
      expect(logSpy).toHaveBeenNthCalledWith(2, 'debug', 'end: parsing env-file variables');
    });

    test('should honor passed in fileOptions', () => {
      const loopSpy = jest.fn();
      const parseEnvFileSpy = jest.spyOn(utils, 'parseEnvFile').mockReturnValue(void 0);
      const logSpy = jest.fn();
      const unifiedEnv = new UnifiedEnv({});
      unifiedEnv['_loopThroughResults'] = loopSpy;
      unifiedEnv['_log'] = logSpy;

      const fileOptions: IFileOptions = {
        encoding: 'does-not-matter',
        filePath: './src/whatever',
        failIfNotFound: false
      }
      unifiedEnv.file(fileOptions);
      expect(parseEnvFileSpy).toHaveBeenCalledWith(fileOptions);
    });
  });

  describe.skip('generate()', () => {
    throw new Error('write these')
  });

  describe('_log()', () => {
    test('should only log messages greater than or equal to log level', () => {
      const unifiedEnv = new UnifiedEnv({}, {
        logger: spyLogger,
        logLevel: 'info'
      });

      const logMsg = 'I am a log';
      const debugMsg = 'I am a debug';
      const infoMsg = 'I am a info';
      const warnMsg = 'I am a warn';
      const errorMsg = 'I am a error';

      unifiedEnv['_log']('log', logMsg);
      unifiedEnv['_log']('debug', debugMsg);
      unifiedEnv['_log']('info', infoMsg);
      unifiedEnv['_log']('warn', warnMsg);
      unifiedEnv['_log']('error', errorMsg);

      expect(spyLogger.log).not.toHaveBeenCalled();
      expect(spyLogger.debug).not.toHaveBeenCalled();
      expect(spyLogger.info).toHaveBeenCalledWith(`${LIB_NAME}:`, infoMsg);
      expect(spyLogger.warn).toHaveBeenCalledWith(`${LIB_NAME}:`, warnMsg);
      expect(spyLogger.error).toHaveBeenCalledWith(`${LIB_NAME}:`, errorMsg);
    });
  });

  describe('_loopThroughResults()', () => {
    test('should call _addValueToConfig for all expected vars found in passed in argument', () => {
      const loggy = 'Hi, I am loggy';
      const ignoreMe = 'I should\'t exist';
      const passedInResults = {
        LOGGY: loggy,
        IGNORE_ME: ignoreMe,
      };
      const unifiedEnv = new UnifiedEnv({ LOGGY: true });

      const spy = jest.fn();
      const logSpy = jest.fn();
      unifiedEnv['_addValueToConfig'] = spy;
      unifiedEnv['_log'] = logSpy;

      unifiedEnv['_loopThroughResults']('argv', passedInResults);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('debug', expect.stringContaining('found key "LOGGY" in argv'));
      expect(spy).toHaveBeenCalledWith('LOGGY', loggy, 'argv');
      expect(spy).not.toHaveBeenCalledWith('IGNORE_ME', ignoreMe);
    });
  });

  describe('_addValueToConfig()', () => {
    test('should add values that are expected', () => {
      const key = 'EXPECTED';
      const value = 'VALUE';
      const envVars: IEnvOptionsObject = {
        EXPECTED: true
      };

      const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
      const spy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);

      unifiedEnv['_addValueToConfig'](key, value, 'argv');
      expect(unifiedEnv['_returnConfig'][key]).toBe(value);
      expect(spy).toHaveBeenCalledWith(key, value);
    });

    test('should skip values that are not expected', () => {
      const key = 'UNEXPECTED';
      const value = 'VALUE';

      const envVars: IEnvOptionsObject = {
        EXPECTED: true
      };
      const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });

      const spy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);
      const logSpy = jest.spyOn(unifiedEnv, '_log' as any);

      unifiedEnv['_addValueToConfig'](key, value, 'argv');
      expect(unifiedEnv['_returnConfig'][key]).toBe(undefined);
      expect(spy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('warn', expect.stringContaining(`key "${key}" was not found`));
    });

    describe('should preform a tieBreaker if the key is already set', () => {
      test('and return if the tieBreaker did not pass', () => {
        const key = 'EXPECTED';
        const curValue = 'VALUE';
        const newValue = 'NEW_VALUE';

        const envVars: IEnvOptionsObject = {
          EXPECTED: true
        };
        const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
        const setSpy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);
        const logSpy = jest.spyOn(unifiedEnv, '_log' as any);
        const tieBreakerSpy = jest.spyOn(unifiedEnv, '_preformTieBreaker' as any).mockReturnValue(false);

        unifiedEnv['_returnConfig'][key] = curValue;
        unifiedEnv['_addValueToConfig'](key, newValue, 'argv');

        expect(tieBreakerSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, from: 'argv' });
        expect(logSpy).toHaveBeenCalledWith('info', expect.stringContaining(`key "${key}" already has value`));
        expect(setSpy).not.toHaveBeenCalled();
        expect(unifiedEnv['_returnConfig'][key]).toBe(curValue);
      });

      test('and continue/overwrite value if the tieBreaker passed', () => {
        const key = 'EXPECTED';
        const curValue = 'VALUE';
        const newValue = 'NEW_VALUE';

        const envVars: IEnvOptionsObject = {
          EXPECTED: { tieBreaker: 'argv' }
        };
        const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
        const setSpy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);
        const logSpy = jest.spyOn(unifiedEnv, '_log' as any);
        const tieBreakerSpy = jest.spyOn(unifiedEnv, '_preformTieBreaker' as any).mockReturnValue(true);

        unifiedEnv['_returnConfig'][key] = curValue;
        unifiedEnv['_addValueToConfig'](key, newValue, 'argv');

        expect(tieBreakerSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, from: 'argv' });
        expect(logSpy).toHaveBeenCalledWith('info', expect.stringContaining(`key "${key}" already has value`));
        expect(setSpy).toHaveBeenCalledWith(key, newValue);
        expect(unifiedEnv['_returnConfig'][key]).toBe(newValue);
      });
    });

    describe('should set config value to a string', () => {
      test('if expectedVariable is "true"', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: IEnvOptionsObject = {
          EXPECTED: true
        };

        const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);

        unifiedEnv['_addValueToConfig'](key, value, 'argv');
        expect(unifiedEnv['_returnConfig'][key]).toBe(value);
        expect(typeof unifiedEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });

      test('if expectedVariable.type is not set', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: IEnvOptionsObject = {
          EXPECTED: { required: true }
        };

        const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);

        unifiedEnv['_addValueToConfig'](key, value, 'argv');
        expect(unifiedEnv['_returnConfig'][key]).toBe(value);
        expect(typeof unifiedEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });

      test('if expectedVariable.type is set to String', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: IEnvOptionsObject = {
          EXPECTED: { required: true, type: String }
        };

        const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);

        unifiedEnv['_addValueToConfig'](key, value, 'argv');
        expect(unifiedEnv['_returnConfig'][key]).toBe(value);
        expect(typeof unifiedEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });
    });

    test('should parse boolean|number variables', () => {
      const key = 'EXPECTED';
      const value = 'true';
      const parsedValue = true;
      const envVars: IEnvOptionsObject = {
        EXPECTED: { required: true, type: Boolean }
      };

      const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
      const setSpy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);
      const parseSpy = jest.spyOn(unifiedEnv, '_parseExpectedVariable' as any).mockReturnValue(parsedValue);

      unifiedEnv['_addValueToConfig'](key, value, 'argv');
      expect(unifiedEnv['_returnConfig'][key]).toBe(parsedValue);
      expect(typeof unifiedEnv['_returnConfig'][key]).toBe('boolean');
      expect(setSpy).toHaveBeenCalledWith(key, parsedValue);
      expect(parseSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, value });
    });

    test('should throw if parsing boolean|number variables fails', () => {
      const key = 'EXPECTED';
      const value = 'true_';
      const parsedValue = true;
      const errMsg = 'the parsing error';
      const envVars: IEnvOptionsObject = {
        EXPECTED: { required: true, type: Boolean }
      };

      const unifiedEnv = new UnifiedEnv(envVars, { logger: spyLogger });
      const setSpy = jest.spyOn(unifiedEnv, '_setReturnedConfigValue' as any);
      const logSpy = jest.spyOn(unifiedEnv, '_log' as any);
      const parseSpy = jest.spyOn(unifiedEnv, '_parseExpectedVariable' as any).mockImplementation(() => { throw new Error(errMsg); });

      unifiedEnv['_addValueToConfig'](key, value, 'argv');
      expect(unifiedEnv['_returnConfig'][key]).toBe(undefined);
      expect(logSpy).toHaveBeenCalledWith('error', errMsg);
      expect(logSpy).toHaveBeenCalledWith('warn', expect.stringContaining(`key "${key}" had a parsing error.`));
      expect(setSpy).not.toHaveBeenCalledWith();
      expect(parseSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, value });
    });
  });

  describe('_preformTieBreaker()', () => {
    let unifiedEnv: UnifiedEnv<any, any>;
    beforeEach(() => {
      unifiedEnv = new UnifiedEnv({});
    });
    describe('should return false if', () => {
      test('the expected variable is not an EnvObject', () => {
        const fn = unifiedEnv['_preformTieBreaker'].bind(unifiedEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable = true;

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });

      test('the expected variable does not have a tieBreaker', () => {
        const fn = unifiedEnv['_preformTieBreaker'].bind(unifiedEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: IEnvOption = { required: true };

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });

      test('the expected variable\'s tieBreaker does not match the "from"', () => {
        const fn = unifiedEnv['_preformTieBreaker'].bind(unifiedEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: IEnvOption = { required: true, tieBreaker: 'env' };

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });
    });

    describe('should return true if', () => {
      test('the expected variable\'s tieBreaker matches the "from"', () => {
        const fn = unifiedEnv['_preformTieBreaker'].bind(unifiedEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: IEnvOption = { required: true, tieBreaker: 'argv' };

        expect(fn({ expectedVariable, key, from })).toBe(true);
      });
    });
  });

  describe('_parseExpectedVariable()', () => {
    test('should parse correctly', () => {
      const BOOL_VAL: IEnvOption = { type: Boolean };
      const NUM_VAL: IEnvOption = { type: Number };
      const unifiedEnv = new UnifiedEnv({ BOOL_VAL, NUM_VAL });
      const fn = unifiedEnv['_parseExpectedVariable'].bind(unifiedEnv);
      const numValue = '1234.5';
      const boolValue = 'false';

      expect(fn({ expectedVariable: BOOL_VAL, key: 'BOOL_VAL', value: boolValue })).toBe(false);
      expect(fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toBe(1234.5);
    });

    test('should delete any existing parsing errors', () => {
      const NUM_VAL: IEnvOption = { type: Number };
      const unifiedEnv = new UnifiedEnv({ NUM_VAL });
      const fn = unifiedEnv['_parseExpectedVariable'].bind(unifiedEnv);
      const numValue = '1234.5';
      unifiedEnv['_errors'].NUM_VAL = ['There was an error'];

      expect(fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toBe(1234.5);
      expect(unifiedEnv['_errors'].NUM_VAL).toBe(undefined);
    });

    test('should throw an error if parsing failed', () => {
      const BOOL_VAL: IEnvOption = { type: Boolean };
      const NUM_VAL: IEnvOption = { type: Number };
      const UNKNOWN_VAL: IEnvOption = { type: Array } as any;

      const unifiedEnv = new UnifiedEnv({ BOOL_VAL, NUM_VAL, UNKNOWN_VAL });
      const fn = unifiedEnv['_parseExpectedVariable'].bind(unifiedEnv);
      const numValue = 'not-a-number';
      const boolValue = 'not-a-boolean';

      expect(() => fn({ expectedVariable: BOOL_VAL, key: 'BOOL_VAL', value: boolValue })).toThrow();
      expect(() => fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toThrow();
      expect(() => fn({ expectedVariable: UNKNOWN_VAL, key: 'UNKNOWN_VAL', value: '' })).toThrow();
    });
  });

  describe('_setReturnedConfigValue()', () => {
    test('should log and set config value', () => {
      const unifiedEnv = new UnifiedEnv({});
      const fn = unifiedEnv['_setReturnedConfigValue'].bind(unifiedEnv);
      const spy = jest.spyOn(unifiedEnv, '_log' as any);
      const val1 = { key: 'VAL1', value: 'value1' };
      const val2 = { key: 'VAL2', value: true };
      const val3 = { key: 'VAL3', value: 123.45 };
      const expected = {
        VAL1: val1.value,
        VAL2: val2.value,
        VAL3: val3.value
      };
      fn(val1.key, val1.value);
      fn(val2.key, val2.value);
      fn(val3.key, val3.value);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, 'info', 'setting config variable:',
        JSON.stringify({ VAL1: val1.value }));
      expect(spy).toHaveBeenNthCalledWith(2, 'info', 'setting config variable:',
        JSON.stringify({ VAL2: val2.value }));
      expect(spy).toHaveBeenNthCalledWith(3, 'info', 'setting config variable:',
        JSON.stringify({ VAL3: val3.value }));

      expect(unifiedEnv['_returnConfig']).toEqual(expected);
    });
  });

  describe.skip('_addErrorMessage()', () => {

  });
});
