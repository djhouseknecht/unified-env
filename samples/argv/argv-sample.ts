import { UnifiedEnv } from '../../src/index';

/**
 * In this example, UnifiedEnv will parse the `process.argv` 
 *  and return an object with the requested config
 * 
 * From the root directory run the following command
 * ``` sh
 * npm run sample:argv
 * ```
 * 
 * OR, run this command
 * ``` sh
 * ts-node samples/argv/argv-sample.ts --APP_VAR=app variable --APP_BOOL=false --APP_PORT=3000
 * ```
 */

const environment = new UnifiedEnv({
  APP_VAR: true, // `true` = a required, string
  APP_BOOL: { required: true, type: Boolean }, // a required boolean
  APP_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] }, // a required number of 2000, 3000, or 4000
  APP_DEFAULT: { required: true, defaultValue: 'app default' }, // required with a defaultt value 
  list: { required: true, type: Boolean } // a required boolean that interprets `--list` as `true`
})
  .argv() // parse `process.argv`
  .generate(); // generate the env object

console.log('argv-sample.ts generated environment: \n');
console.log(environment);

/* console output will be */

// { APP_VAR: 'app variable',
//   APP_BOOL: false,
//   APP_PORT: 3000,
//   APP_DEFAULT: 'app default'
//   list: true }

export default environment;