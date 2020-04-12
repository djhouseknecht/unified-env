import { resolve } from 'path';
import { UnifiedEnv } from '../../src/index';

/**
 * In this example, UnifiedEnv will parse the `.env` file
 *  and return an object with the requested config
 * 
 * From the root directory run the following command
 * ``` sh
 * npm run sample:file
 * ```
 * 
 * OR, run this command
 * ``` sh
 * ts-node samples/file/file-sample.ts
 * ```
 */

const filePath = resolve(process.cwd(), 'samples/file/.env');

const environment = new UnifiedEnv({
  APP_VAR: true, // `true` = a required, string
  APP_BOOL: { required: true, type: Boolean }, // a required boolean
  APP_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] }, // a required number of 200, 300, or 4000
  APP_DEFAULT: { required: true, defaultValue: 'app default' } // required with a defaultt value 
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