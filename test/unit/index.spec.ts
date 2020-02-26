import {
  ISimpleEnvOptions,
  ILogger,
  IFileOptions,
  EnvOptionsObject,
  EnvOption
} from '../../src/utils/interfaces';
import { SimpleEnv } from '../../src/index';
import * as utils from '../../src/utils/utils';
import { LIB_NAME } from '../../src/utils/utils';

const spyLogger: ILogger = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const defaultConfigOptions: ISimpleEnvOptions = {
  logLevel: 'warn',
  logger: console,
  // requireOrder: ['dev', 'test', 'prod'],
  // orderField: 'ENV'
};

describe('SimpleEnv', () => {
  describe('constructor()', () => {
    test('should set expected env variables and config to default config', () => {
      const envVars = { K: {}, B: {} };
      const config = new SimpleEnv(envVars);
      expect(config['_simpleEnvOptions']).toEqual(defaultConfigOptions);
      expect(config['_expectedEnvVariables']).toEqual(envVars);
    });

    test('should lowercase passed in logLevel', () => {
      const config = new SimpleEnv({}, { logLevel: 'ERROR' as any });
      expect(config['_simpleEnvOptions'].logLevel).toEqual('error');
    });

    test('should validate config options and expectedEnvVariables', () => {
      const configSpy = jest.spyOn(utils, 'validateConfigOptions');
      const varSpy = jest.spyOn(utils, 'validateExpectedVariables');
      const envVars = { K: {}, B: {} };
      new SimpleEnv(envVars);
      expect(configSpy).toHaveBeenCalledWith(defaultConfigOptions);
      expect(varSpy).toHaveBeenCalledWith(envVars);
    });

    test('should merge config options with defaults', () => {
      const options: Partial<ISimpleEnvOptions> = {
        logLevel: 'debug',
        // orderField: 'KTY'
      };
      const env = new SimpleEnv({}, options);
      expect(env['_simpleEnvOptions']).toEqual({
        logLevel: 'debug',
        logger: console,
        // requireOrder: ['dev', 'test', 'prod'],
        // orderField: 'KTY'
      });
    });
  });

  describe('env()', () => {
    test('should call _loopThroughResults with process.env variables', () => {
      const simpleEnv = new SimpleEnv({});
      const loopSpy = jest.fn();
      const logSpy = jest.fn();
      simpleEnv['_loopThroughResults'] = loopSpy;
      simpleEnv['_log'] = logSpy;

      simpleEnv.env();
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
      const simpleEnv = new SimpleEnv({});
      simpleEnv['_loopThroughResults'] = loopSpy;
      simpleEnv['_log'] = logSpy;

      simpleEnv.argv();
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
        encoding: 'utf-8'
      };

      const loopSpy = jest.fn();
      const parseEnvFileSpy = jest.spyOn(utils, 'parseEnvFile').mockReturnValue(mockEnvFileReturnObject);
      const logSpy = jest.fn();
      const simpleEnv = new SimpleEnv({});
      simpleEnv['_loopThroughResults'] = loopSpy;
      simpleEnv['_log'] = logSpy;

      simpleEnv.file();
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
      const simpleEnv = new SimpleEnv({});
      simpleEnv['_loopThroughResults'] = loopSpy;
      simpleEnv['_log'] = logSpy;

      const fileOptions: IFileOptions = {
        encoding: 'does-not-matter',
        filePath: './src/whatever'
      }
      simpleEnv.file(fileOptions);
      expect(parseEnvFileSpy).toHaveBeenCalledWith(fileOptions);
    });
  });

  describe.skip('generate()', () => {
    throw new Error('write these')
  });

  describe('_log()', () => {
    test('should only log messages greater than or equal to log level', () => {
      const simpleEnv = new SimpleEnv({}, {
        logger: spyLogger,
        logLevel: 'info'
      });

      const logMsg = 'I am a log';
      const debugMsg = 'I am a debug';
      const infoMsg = 'I am a info';
      const warnMsg = 'I am a warn';
      const errorMsg = 'I am a error';

      simpleEnv['_log']('log', logMsg);
      simpleEnv['_log']('debug', debugMsg);
      simpleEnv['_log']('info', infoMsg);
      simpleEnv['_log']('warn', warnMsg);
      simpleEnv['_log']('error', errorMsg);

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
      const simpleEnv = new SimpleEnv({ LOGGY: true });

      const spy = jest.fn();
      const logSpy = jest.fn();
      simpleEnv['_addValueToConfig'] = spy;
      simpleEnv['_log'] = logSpy;

      simpleEnv['_loopThroughResults']('argv', passedInResults);
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
      const envVars: EnvOptionsObject = {
        EXPECTED: true
      };

      const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
      const spy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);

      simpleEnv['_addValueToConfig'](key, value, 'argv');
      expect(simpleEnv['_returnConfig'][key]).toBe(value);
      expect(spy).toHaveBeenCalledWith(key, value);
    });

    test('should skip values that are not expected', () => {
      const key = 'UNEXPECTED';
      const value = 'VALUE';

      const envVars: EnvOptionsObject = {
        EXPECTED: true
      };
      const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });

      const spy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);
      const logSpy = jest.spyOn(simpleEnv, '_log' as any);

      simpleEnv['_addValueToConfig'](key, value, 'argv');
      expect(simpleEnv['_returnConfig'][key]).toBe(undefined);
      expect(spy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('warn', expect.stringContaining(`key "${key}" was not found`));
    });

    describe('should preform a tieBreaker if the key is already set', () => {
      test('and return if the tieBreaker did not pass', () => {
        const key = 'EXPECTED';
        const curValue = 'VALUE';
        const newValue = 'NEW_VALUE';

        const envVars: EnvOptionsObject = {
          EXPECTED: true
        };
        const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
        const setSpy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);
        const logSpy = jest.spyOn(simpleEnv, '_log' as any);
        const tieBreakerSpy = jest.spyOn(simpleEnv, '_preformTieBreaker' as any).mockReturnValue(false);

        simpleEnv['_returnConfig'][key] = curValue;
        simpleEnv['_addValueToConfig'](key, newValue, 'argv');

        expect(tieBreakerSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, from: 'argv' });
        expect(logSpy).toHaveBeenCalledWith('info', expect.stringContaining(`key "${key}" already has value`));
        expect(setSpy).not.toHaveBeenCalled();
        expect(simpleEnv['_returnConfig'][key]).toBe(curValue);
      });

      test('and continue/overwrite value if the tieBreaker passed', () => {
        const key = 'EXPECTED';
        const curValue = 'VALUE';
        const newValue = 'NEW_VALUE';

        const envVars: EnvOptionsObject = {
          EXPECTED: { tieBreaker: 'argv' }
        };
        const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
        const setSpy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);
        const logSpy = jest.spyOn(simpleEnv, '_log' as any);
        const tieBreakerSpy = jest.spyOn(simpleEnv, '_preformTieBreaker' as any).mockReturnValue(true);

        simpleEnv['_returnConfig'][key] = curValue;
        simpleEnv['_addValueToConfig'](key, newValue, 'argv');

        expect(tieBreakerSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, from: 'argv' });
        expect(logSpy).toHaveBeenCalledWith('info', expect.stringContaining(`key "${key}" already has value`));
        expect(setSpy).toHaveBeenCalledWith(key, newValue);
        expect(simpleEnv['_returnConfig'][key]).toBe(newValue);
      });
    });

    describe('should set config value to a string', () => {
      test('if expectedVariable is "true"', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: EnvOptionsObject = {
          EXPECTED: true
        };

        const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);

        simpleEnv['_addValueToConfig'](key, value, 'argv');
        expect(simpleEnv['_returnConfig'][key]).toBe(value);
        expect(typeof simpleEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });

      test('if expectedVariable.type is not set', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: EnvOptionsObject = {
          EXPECTED: { required: true }
        };

        const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);

        simpleEnv['_addValueToConfig'](key, value, 'argv');
        expect(simpleEnv['_returnConfig'][key]).toBe(value);
        expect(typeof simpleEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });

      test('if expectedVariable.type is set to String', () => {
        const key = 'EXPECTED';
        const value = 'VALUE';
        const envVars: EnvOptionsObject = {
          EXPECTED: { required: true, type: String }
        };

        const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
        const spy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);

        simpleEnv['_addValueToConfig'](key, value, 'argv');
        expect(simpleEnv['_returnConfig'][key]).toBe(value);
        expect(typeof simpleEnv['_returnConfig'][key]).toBe('string');
        expect(spy).toHaveBeenCalledWith(key, value);
      });
    });

    test('should parse boolean|number variables', () => {
      const key = 'EXPECTED';
      const value = 'true';
      const parsedValue = true;
      const envVars: EnvOptionsObject = {
        EXPECTED: { required: true, type: Boolean }
      };

      const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
      const setSpy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);
      const parseSpy = jest.spyOn(simpleEnv, '_parseExpectedVariable' as any).mockReturnValue(parsedValue);

      simpleEnv['_addValueToConfig'](key, value, 'argv');
      expect(simpleEnv['_returnConfig'][key]).toBe(parsedValue);
      expect(typeof simpleEnv['_returnConfig'][key]).toBe('boolean');
      expect(setSpy).toHaveBeenCalledWith(key, parsedValue);
      expect(parseSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, value });
    });

    test('should throw if parsing boolean|number variables fails', () => {
      const key = 'EXPECTED';
      const value = 'true_';
      const parsedValue = true;
      const errMsg = 'the parsing error';
      const envVars: EnvOptionsObject = {
        EXPECTED: { required: true, type: Boolean }
      };

      const simpleEnv = new SimpleEnv(envVars, { logger: spyLogger });
      const setSpy = jest.spyOn(simpleEnv, '_setReturnedConfigValue' as any);
      const logSpy = jest.spyOn(simpleEnv, '_log' as any);
      const parseSpy = jest.spyOn(simpleEnv, '_parseExpectedVariable' as any).mockImplementation(() => { throw new Error(errMsg); });

      simpleEnv['_addValueToConfig'](key, value, 'argv');
      expect(simpleEnv['_returnConfig'][key]).toBe(undefined);
      expect(logSpy).toHaveBeenCalledWith('error', errMsg);
      expect(logSpy).toHaveBeenCalledWith('warn', expect.stringContaining(`key "${key}" had a parsing error.`));
      expect(setSpy).not.toHaveBeenCalledWith();
      expect(parseSpy).toHaveBeenCalledWith({ expectedVariable: envVars.EXPECTED, key, value });
    });
  });

  describe('_preformTieBreaker()', () => {
    let simpleEnv: SimpleEnv<any, any>;
    beforeEach(() => {
      simpleEnv = new SimpleEnv({});
    });
    describe('should return false if', () => {
      test('the expected variable is not an EnvObject', () => {
        const fn = simpleEnv['_preformTieBreaker'].bind(simpleEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable = true;

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });

      test('the expected variable does not have a tieBreaker', () => {
        const fn = simpleEnv['_preformTieBreaker'].bind(simpleEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: EnvOption = { required: true };

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });

      test('the expected variable\'s tieBreaker does not match the "from"', () => {
        const fn = simpleEnv['_preformTieBreaker'].bind(simpleEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: EnvOption = { required: true, tieBreaker: 'env' };

        expect(fn({ expectedVariable, key, from })).toBe(false);
      });
    });

    describe('should return true if', () => {
      test('the expected variable\'s tieBreaker matches the "from"', () => {
        const fn = simpleEnv['_preformTieBreaker'].bind(simpleEnv);
        const from = 'argv';
        const key = 'KEY';
        const expectedVariable: EnvOption = { required: true, tieBreaker: 'argv' };

        expect(fn({ expectedVariable, key, from })).toBe(true);
      });
    });
  });

  describe('_parseExpectedVariable()', () => {
    test('should parse correctly', () => {
      const BOOL_VAL: EnvOption = { type: Boolean };
      const NUM_VAL: EnvOption = { type: Number };
      const simpleEnv = new SimpleEnv({ BOOL_VAL, NUM_VAL });
      const fn = simpleEnv['_parseExpectedVariable'].bind(simpleEnv);
      const numValue = '1234.5';
      const boolValue = 'false';

      expect(fn({ expectedVariable: BOOL_VAL, key: 'BOOL_VAL', value: boolValue })).toBe(false);
      expect(fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toBe(1234.5);
    });

    test('should delete any existing parsing errors', () => {
      const NUM_VAL: EnvOption = { type: Number };
      const simpleEnv = new SimpleEnv({ NUM_VAL });
      const fn = simpleEnv['_parseExpectedVariable'].bind(simpleEnv);
      const numValue = '1234.5';
      simpleEnv['_errors'].NUM_VAL = ['There was an error'];

      expect(fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toBe(1234.5);
      expect(simpleEnv['_errors'].NUM_VAL).toBe(undefined);
    });

    describe('should throw if parsing fails', () => {
      test('should throw an error if parsing failed', () => {
        const BOOL_VAL: EnvOption = { type: Boolean };
        const NUM_VAL: EnvOption = { type: Number };
        const UNKNOWN_VAL: EnvOption = { type: Array } as any;

        const simpleEnv = new SimpleEnv({ BOOL_VAL, NUM_VAL, UNKNOWN_VAL });
        const fn = simpleEnv['_parseExpectedVariable'].bind(simpleEnv);
        const numValue = 'not-a-number';
        const boolValue = 'not-a-boolean';

        expect(() => fn({ expectedVariable: BOOL_VAL, key: 'BOOL_VAL', value: boolValue })).toThrow();
        expect(() => fn({ expectedVariable: NUM_VAL, key: 'NUM_VAL', value: numValue })).toThrow();
        expect(() => fn({ expectedVariable: UNKNOWN_VAL, key: 'UNKNOWN_VAL', value: '' })).toThrow();
      });
    });
  });

  describe('_setReturnedConfigValue()', () => {
    test('should log and set config value', () => {
      const simpleEnv = new SimpleEnv({});
      const fn = simpleEnv['_setReturnedConfigValue'].bind(simpleEnv);
      const spy = jest.spyOn(simpleEnv, '_log' as any);
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

      expect(simpleEnv['_returnConfig']).toEqual(expected);
    });
  });

  describe.skip('_addErrorMessage()', () => {

  });
});
