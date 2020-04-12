const { SimpleEnv } = require('../../dist/index');
const expectedVariables = {
  STR_VAL: {
    required: true,
    type: String,
    acceptableValues: ['string', true],
    tieBreaker: 'argv'
  }
};

const simpleEnv = new SimpleEnv(expectedVariables, { logLevel: 'info' });
console.log({ argv: process.argv })
try {
  const config = simpleEnv
    .env()
    .argv()
    .generate();

  console.log(config.STR_VAL);
} catch (e) {
  console.error(e.message);
}

