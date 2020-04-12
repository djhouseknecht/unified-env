import { SimpleEnv } from '../../src/index';

/**
 * In this example, SimpleEnv will parse the `process.env` 
 *  and return an object with the requested config
 * 
 * From the root directory run the following command
 * ``` sh
 * npm run sample:env
 * ```
 * 
 * OR, run this command
 * ``` sh
 * APP_VAR='app variable' APP_BOOL=false APP_PORT=3000 ts-node samples/env/env-sample.ts
 * ```
 */

const environment = new SimpleEnv({
  APP_VAR: true, // `true` = a required, string
  APP_BOOL: { required: true, type: Boolean }, // a required boolean
  APP_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] }, // a required number of 200, 300, or 4000
  APP_DEFAULT: { required: true, defaultValue: 'app default' } // required with a defaultt value 
})
  .env() // parse `process.env`
  .generate(); // generate the env object

console.log('env-sample.ts generated environment: \n');
console.log(environment);

/* console output will be */

// { APP_VAR: 'app variable',
//   APP_BOOL: false,
//   APP_PORT: 3000,
//   APP_DEFAULT: 'app default' }

export default environment;