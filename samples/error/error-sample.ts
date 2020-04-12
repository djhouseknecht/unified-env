import { resolve } from 'path';
import { SimpleEnv } from '../../src/index';

/**
 * In this example, SimpleEnv will attempt to parse an `.env` file 
 *  and fail with multiple errors
 * 
 * From the root directory run the following command
 * ``` sh
 * npm run sample:error
 * ```
 * 
 * OR, run this command
 * ``` sh
 * ts-node samples/error/error-sample.ts 
 * ```
 */

const filePath = resolve(process.cwd(), 'samples/error/.env');

const environment = new SimpleEnv({
  APP_VAR: true, // `true` = a required, string
  APP_BOOL: { required: true, type: Boolean }, // a required boolean
  APP_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] } // a required number of 200, 300, or 4000
})
  .file({ filePath }) // parse ./.env file (built the path since the `.env` file is not in the root directory)
  .generate(); // generate the env object

console.log('file-sample.ts generated environment: \n');
console.log(environment);

/* console output will be */

// { APP_VAR: 'app variable',
//   APP_BOOL: false,
//   APP_PORT: 3000,
//   APP_DEFAULT: 'app default' }

export default environment;