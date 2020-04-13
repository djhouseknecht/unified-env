import { resolve } from 'path';
import { UnifiedEnv } from '../../src/index';

/**
 * In this example, UnifiedEnv will parse `process.env`, `process.argv` and a `.env` file
 *  and return an object with the requested config
 * 
 * From the root directory run the following command
 * ``` sh
 * npm run sample:full
 * ```
 * 
 * OR, run this command
 * ``` sh
 * ENV_VAR='this variable came from process.env' ts-node samples/full/full-sample.ts --ARGV_VAR=this variable came from process.argv --TIE_VAR=tie var from process.argv should be overridden by the file tiebreaker
 * ```
 */

/* build the path to the .env file */
const filePath = resolve(process.cwd(), 'samples/full/.env');

const environment = new UnifiedEnv({
  ENV_VAR: true, // `true` = a required, string
  ARGV_VAR: true,
  FILE_VAR: true,
  APP_BOOL: { required: true, type: Boolean }, // a required boolean
  APP_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] }, // a required number of 2000, 3000, or 4000
  APP_DEFAULT: { required: true, defaultValue: 'app default' }, // required with a defaultt value 
  TIE_VAR: { required: true, tieBreaker: 'file' } // a variable from the `.env` will _always_ override an existing variable
})
  .env() // parse `process.env`
  .argv() // parse `process.argv`
  .file({ filePath }) // parse ./.env file (built the path since the `.env` file is not in the root directory)
  .generate(); // generate the env object

console.log('full-sample.ts generated environment: \n');
console.log(environment);

/* console output will be */

// { ENV_VAR: 'this variable came from process.env',
//   ARGV_VAR: 'this variable came from process.argv',
//   TIE_VAR:
//    'this variable (from the .env file) will always win even if process.env or process.argv declares it',
//   FILE_VAR: 'this variable came from the .env fie',
//   APP_BOOL: false,
//   APP_PORT: 3000,
//   APP_DEFAULT: 'app default' }

export default environment;