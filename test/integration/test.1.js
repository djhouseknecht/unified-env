const { UnifiedEnv } = require('../../dist/index');
const expectedVariables = {
  STR_VAL: {
    required: true,
    type: String,
    acceptableValues: ['string', true],
    tieBreaker: 'argv'
  }
};

const unifiedEnv = new UnifiedEnv(expectedVariables, { logLevel: 'info' });
console.log({ argv: process.argv })
try {
  const config = unifiedEnv
    .env()
    .argv()
    .generate();

  console.log(config.STR_VAL);
} catch (e) {
  console.error(e.message);
}

