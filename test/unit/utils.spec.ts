import { parseArgv, parseEnvFile, validateConfigOptions } from '../../src/utils/utils';
import { UnifiedEnv } from '../../src/index';
import { IUnifiedEnvOptions, ILogger } from '../../src/utils/interfaces';

describe('Utils', () => {
  const unifiedEnv = new UnifiedEnv({});
  let spy: jest.Mock;
  beforeAll(() => {
    spy = jest.fn()//.mockImplementation((...args) => console.log(...args));
    unifiedEnv['_log'] = spy;
  });

  afterEach(() => {
    spy.mockReset();
  });

  describe('validateConfigOptions()', () => {
    let spyLogger: ILogger;
    let unifiedEnvOptions: IUnifiedEnvOptions;

    beforeEach(() => {
      spyLogger = {
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      unifiedEnvOptions = {
        logLevel: 'debug',
        logger: spyLogger,
        // requireOrder: ['dev', 'test', 'prod'],
        // orderField: 'ENV',
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should error for invalid logLevel', () => {
      unifiedEnvOptions.logLevel = 'NOT_VALID' as any;
      expect(() => validateConfigOptions(unifiedEnvOptions)).toThrow();
      expect(spyLogger.log).toHaveBeenCalledTimes(3);
      expect(spyLogger.log).toHaveBeenNthCalledWith(3, expect.stringContaining('UnifiedEnv: errors - '));
    });

    // test('should error for invalid orderField and/or requireOrder', () => {
    //   unifiedEnvOptions.orderField = 30 as any;
    //   unifiedEnvOptions.requireOrder = 'im not an array' as any;
    //   expect(() => validateConfigOptions(unifiedEnvOptions)).toThrow();
    //   expect(spyLogger.log).toHaveBeenCalledTimes(3);
    //   expect(spyLogger.log).toHaveBeenNthCalledWith(3, expect.stringContaining('orderField must be of type string, requireOrder must be of type array'));
    // });

    test('should error for invalid logger', () => {
      const consoleLogSpy = jest.spyOn(global.console, 'log')

      unifiedEnvOptions.logger = {} as ILogger;
      expect(() => validateConfigOptions(unifiedEnvOptions)).toThrow();
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('logger does not match the expected interface'));
      consoleLogSpy.mockRestore();
    });
  });

  describe('parseEnvFile()', () => {
    test('should parse .env file', () => {
      const results = parseEnvFile.call(unifiedEnv, { filePath: './test/unit/envs/sample.env', encoding: 'utf-8' });
      const expected = {
        ENV: 'dev',
        PORT: '3000',
        LOG_LEVEL: 'debug',
        DATABASE_URL: 'database://url',
        APP_SECRET: 'topsecret ',
        WITH_QUOTES: 'this is a phrase'
      };
      expect(results).toEqual(expected);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should throw if file is not found', () => {
      expect(() => parseEnvFile.call(unifiedEnv, { filePath: './i/dont/exist.env', encoding: 'utf-8' })).toThrow();
    });
  });

  describe('parseArgv()', () => {
    test('should parse argv true|false values', () => {
      const exampleArgs =
        '--DEV ' +
        '--TEST=false ' +
        '--ENV=true ' +
        '--PROD false ';
      const argv = exampleArgs.split(' ');

      const expected = {
        DEV: 'true',
        TEST: 'false',
        ENV: 'true',
        PROD: 'false'
      };
      expect(parseArgv.call(unifiedEnv, argv)).toEqual(expected);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should parse argv string values honoring quotes', () => {
      const exampleArgs =
        '--DEV value ' +
        '--TEST=awesome sauce ' +
        '--ENV=" true value " ' +
        "--PROD 'false value'";
      const argv = exampleArgs.split(' ');

      const expected = {
        DEV: 'value',
        TEST: 'awesome sauce',
        ENV: ' true value ',
        PROD: 'false value'
      };
      expect(parseArgv.call(unifiedEnv, argv)).toEqual(expected);
    });

    test('should log a warning if a key already existed', () => {
      const exampleArgs =
        '--DEV value ' +
        '--TEST=awesome ' +
        '--DEV false';
      const argv = exampleArgs.split(' ');

      const expected = {
        DEV: 'false',
        TEST: 'awesome'
      };
      expect(parseArgv.call(unifiedEnv, argv)).toEqual(expected);
      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('warn', expect.stringContaining(`argv key "DEV" already exists.`));
    });

    test('should handle mistakes', () => {
      const exampleArgs =
        'mistake ' +
        '--DEV false ' +
        '-DB=mongo ' +
        '--TEST ' +
        'URL=www.com ' +
        '--PROD true ' +
        '-- MYSQL ';
      const argv = exampleArgs.split(' ');

      const expected = {
        DEV: 'false -DB=mongo',
        TEST: 'URL=www.com',
        PROD: 'true -- MYSQL'
      };
      expect(parseArgv.call(unifiedEnv, argv)).toEqual(expected);
      expect(spy).toHaveBeenCalledWith('warn', expect.stringContaining('argv value "mistake" is not a key value'))
    });
  });

  describe.skip('validateExpectedVariables()', () => {

  });

  describe.skip('finalTypesMatch()', () => {

  });

  describe.skip('joinArray()', () => {

  });
});
