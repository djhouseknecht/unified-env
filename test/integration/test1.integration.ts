import { EnvOptionsObject } from '../../src/utils/interfaces';
import { UnifiedEnv } from '../../src/index';

// process.argv = [
//   '--STR_VAL=s',
//   'str'
// ];

describe.skip('UnifiedEnv', () => {
  test('should do something', () => {
    const expectedVariables: EnvOptionsObject = {
      STR_VAL: {
        required: true,
        type: String,
        acceptableValues: ['string'],
        tieBreaker: 'argv'
      }
    };

    const unifiedEnv = new UnifiedEnv(expectedVariables);
    console.log({ argv: process.argv })
    const config = unifiedEnv.argv().generate();

    expect(config).toBeTruthy();
  });
});
