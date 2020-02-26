import { EnvOptionsObject } from '../../src/utils/interfaces';
import { SimpleEnv } from '../../src/index';

// process.argv = [
//   '--STR_VAL=s',
//   'str'
// ];

describe.skip('SimpleEnv', () => {
  test('should do something', () => {
    const expectedVariables: EnvOptionsObject = {
      STR_VAL: {
        required: true,
        type: String,
        acceptableValues: ['string'],
        tieBreaker: 'argv'
      }
    };

    const simpleEnv = new SimpleEnv(expectedVariables);
    console.log({ argv: process.argv })
    const config = simpleEnv.argv().generate();

    expect(config).toBeTruthy();
  });
});
