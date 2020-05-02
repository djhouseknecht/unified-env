[![Build Status](https://travis-ci.org/djhouseknecht/unified-env.svg?branch=master)](https://travis-ci.org/djhouseknecht/unified-env)  [![codecov](https://codecov.io/gh/djhouseknecht/unified-env/branch/master/graph/badge.svg)](https://codecov.io/gh/djhouseknecht/unified-env)  [![npm version](https://badge.fury.io/js/unified-env.svg)](https://badge.fury.io/js/unified-env)  [![dependabot-status](https://flat.badgen.net/dependabot/djhouseknecht/unified-env/?icon=dependabot)][dependabot]  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)  [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) 

# Unified-Env
An lightweight, zero dependency package to unify node environment variables using strong typings 

## Table of Contents
* [Basic Usage](#basic-usage)
* [Advanced Usage](#advanced-usage)
  * [Advanced Env Options](#advanced-env-options)
    * [Parsing `process.env` using `.env()`](#parsing-process.env-using-.env())
    * [Parsing `process.argv` using `.argv()`](#parsing-process.argv-using-.argv())
      * [Argv Casing and Common Mistakes](#argv-casing-and-common-mistakes)
    * [Parsing an Env File using `.file(options)`](#parsing-an-env-file-using-.file(options))
    * [Generate Final Env Object with `.generate()`](#generate-final-env-object-with-.generate())
    * **[Order Matters](#order-matters)**
* [Use Cases](#use-cases)
  * [Real Life Example](#real-life-example)
  * [Heroku Deployments](#heroku-deployments)
  * [Use a Validation Script](#use-a-validation-script)
* [Samples](#samples)
* [Credits](#credits)
* [Coming Soon (TODO)](#coming-soon-(todo))

## Basic Concept 
Unified-env aims to provide a way to ensure required, valid environment variables using TypeScript for a type-safe API. Problems it solves: 
* **Adding new env variables locally and forgetting to add them on the server/hosting environemnt**
* **Not having required env variables set causing errors at runtime** (these can now be caught at start up or compile time)
* **Having invalid env variables set**
* **Not having a central API where all env variables are located and strongly typed**

# Basic Usage

**First**, install from npm: 

``` sh 
npm insall unified-env
# or yarn
yarn add unified-env
```

**Second**, create a central file to use `UnifiedEnv` (for example, `src/environment.ts`) and create your env. 

``` typescript
import { UnifiedEnv } from 'unified-env';

const environment = new UnifiedEnv({
  APP_VAR: true, // `true` = a required, string
  DB_USER: true,
  DB_PASSWORD: true,
  DB_HOST: true,
  DB_NAME: true,
  DB_PORT: { required: true, type: Number, acceptableValues: [2000, 3000, 4000] }, // a required number of 2000, 3000, or 4000
  APP_PROD: { required: true, type: Boolean }, // a required boolean
  APP_DEFAULT: { required: true, defaultValue: 'app default' } // required with a defaultt value 
})
  .env() // parse `process.env`
  .argv() // parse `process.argv`
  .file({ filePath: './.env' }) // parse an `.env` file (relative path)
  .generate(); // generate the environment object

export default environment;
```

The above `UnifedEnv` will parse the `process.env`, then `process.argv`, and then an `.env` file looking for those variables; and generate
a final environment object. It will throw an error if 1) any required variable is missing, 2) there was an error parsing a `Boolean` or `Number` value, 
or 3) a value was not in the listed `acceptableValues` array. The exported `environment` constant will
be strongly typed to the passed in configuration. 

**Third**, import your environment into other files that need env variables (for example, `src/database.ts`)

``` typescript 
import { Client } from 'pg';
import environment from './environment';

/* `environment` will be strongly typed */

const client = new Client({
  user: environment.DB_USER,
  host: environment.DB_HOST,
  database: environment.DB_NAME,
  password: environment.DB_PASSWORD,
  port: environment.DB_PORT,
});

export default client;
```

> See **[Key Notes](#key-notes)** under [Advanced Usage](#advanced-usage)

_*See [Use Cases](#use-cases) for more pracical examples_

# Advanced Usage
All **keys** listed in your `UnifiedEnv` constructor are the variables that will be typed. 

### Key Notes
* All **keys** listed in your `UnifiedEnv` constructor are the variables that will be typed. See [Advanced Env Options](#advanced-env-options)
* **Order matters** when calling `.env()`, `.argv()`, and/or `.file()`, order will matter. See [Order Matters](#order-matters)
* **`.file()` filepath** option is relative to `__dirname` (ie. where you are calling your root node project from). See [Parsing an Env File](#parsing-an-env-file-using-.file(options))
* **`.generate()`** must be called to generate the file env object
* **Only the values passed into UnifiedEnv will be checked**, any variables in `process.env`, `process.argv`, and/or an `.env` file that were not listed in the configuration, will **NOT** be in the environment object returned from `generate()`. See [parsing `process.env`](#parsing-process.env-using-.env()) available.
* **Keys are _CASE SENSATIVE_ and not parsed differently for each source**. `process.env`, `process.argv` and `.env` file keys are all treated the same. Example; if `UnifiedEnv` has a configuration item of `{ MY_KEY: true }` and `process.argv` has `--my-key='hello'`, `UnifiedEnv` _**will not**_ match against that key. 

## Advanced Env Options
There are several advanced configuration options for desired variables.

``` typescript
const env = new UnifiedEnv({
  /* acceptable configuration options */
  MY_VAR: true | {
    required?: boolean,
    type?: String | Number | Boolean,
    defaultValue?: string | boolean | number,
    acceptableValues?: (string | boolean | number)[],
    tieBreaker?: 'env' | 'argv' | 'file'
  }
}, {
  logLevel?: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger?: ILogger 
});
```

Each **key** must be of the following type: 
* 1st Argument (expectedEnvVariables - required)
  * `true`: will default to `{ required: true, type: String }`
  * `EnvOption` object: all options are **optional**. _note: a blank object will be treated as `true`_
    * `required: boolean`: If `true`, an error will be throw when `.generate()` is called if the variable is not set. If `false`, no error will be thrown
    * `type: String | Number | Boolean`: If `String` (default), the variable will be returned as a `string`. If `Number`, the variable will be parsed to a `number` (an error will be throw if parsing fails). If `Boolean`, the variable will be parsed to a `boolean` (an error will be throw if parsing fails)
    * `defaultValue: string | boolean | number`: If the key has not been set, this default value will be used. _Ensure the `defaultValue` matches the typeof the `type` option (`string` is default)_
    * `acceptableValues: (string | boolean | number)[]`: The variable value must be a value found in this array. _Ensure the `defaultValue` matches the typeof the `type` option (`string` is default)_
    * `tieBreaker: 'env' | 'argv' | 'file'`: The value from the listed `tieBreaker` will always be used in the event of the same value coming from different sources. Example, `process.env` has `MY_VAR=hello` and `process.argv` has `--MY_VAR=goodbye`; if MY_VAR has a `tieBreaker = 'argv'`, the value from `process.argv` will _always_ be used -- even if `.env()` was called before `.argv()` (See [Order Matters](#order-matters) for more details). In this example, MY_VAR will equal `'goodbye'`. 
  * 2nd argument (configOptions - optional)
    * `Object` 
      * `logLevel: 'log' | 'debug' | 'info' | 'warn' | 'error'`: (default: `'warn'`) will control what kind of logs are displayed
      * `logger: ILogger`: (default `console`) any object that implements an `ILogger` interface
        * ``` typescript
          interface ILogger {
            log (...args: any[]): void;
            debug (...args: any[]): void;
            info (...args: any[]): void;
            warn (...args: any[]): void;
            error (...args: any[]): void;
          };
          ```
          
### Parsing `process.env` using `.env()`

`UnifiedEnv` will check the `process.env` keys for any matching key in the `UnifiedEnv` configuration. Only keys that match will be parsed. 

For example, if the `process.env` has the following values: 
``` sh
ENV=prod LOG_LEVEL=debug ts-node my-unified-env.ts
``` 

And the `UnifiedEnv` configuration looks like:

``` typescript
const env = new UnifiedEnv({ LOG_LEVEL: true }).env().generate();
export default env;
```

The exported `env` will _NOT_ has an `ENV` property. 

> Note: this rule applies to both `.argv()` and `.file()`

### Parsing `process.argv` using `.argv()`

As mentioned in the **[Key Notes](#key-notes)** section, `UnifiedEnv` does not handle casing differently for `process.argv` keys. 
The reason being twofold: 
1. There are plenty of other libraries out there that parse `process.argv` uniquely. `UnifiedEnv` is not trying to replicate those. 
2. `UnifiedEnv` aims to be _as simple, and straight forward as possible_. Having different naming conventions only complicates using this (or any) library. 

For `process.argv` usage, take the following example: 

``` typescript
const env = new UnifiedEnv({ 
  LOG_LEVEL: true,
  DB_USERNAME: true,
  DB_PASSWORD: true
})
  .argv().generate();

export default env;
```

`process.argv` would need to have the same matching keys. An example command line call may look like: 
``` sh
ts-node my-example-env.ts --LOG_LEVEL=info --DB_USERNAME=user123 --DB_PASSWORD=secrect123
```

#### Argv Casing and Common Mistakes
Some rules and common mistakes to help understand how `UnifiedEnv` will parse `process.argv`: 

``` sh
# CASING MATTERS (only matches on exact case)
# white space is trimmed if not in quotes
 
# SINGLE VALUE
--DEV # { DEV: 'true' } <- note, this will always be string unless you specific type: Boolean in the config
--DEV=true # { DEV: 'true' }
--DEV=false # { DEV: 'false' }
--DEV true # { DEV: 'true' } 
--DEV false # { DEV: 'false' } 
--DEV is awesome # { dev: 'is awesome' }
--DB 'some url ' # { dev: 'some url ' }

# MULTI VALUES
--DEV=true dat --PIE # { DEV: 'true dat', PIE: 'true' }
--DEV --PIE apple # { DEV: 'true', PIE: 'apple' }
--DEV --PIE apple with cherry # { DEV: 'true', PIE: 'apple with cherry' }

# COMMON MISTAKES
  # args must start with `--` 
mistake --OTHER_VALUE # { OTHER_VALUE: 'true' }
  # if they do not start with `--`, they will be 
  # treated as a string for the previous value
--DEV true -DB=mongo # { DEV: 'true -DB=mongo' }
--DEV true DB=mongo # { DEV: 'true DB=mongo' }

  # keys must be in format `--{key}` otherwise they will be treated
  # as strings for the previous value
--DEV false -- DB mysql # { DEV: 'false -- DB mysql' }
-- DEV true # { } # no output since no initial key was found

  # equals cannot have spaces
--SECRET = 'top secret' # { SECRET: '= \'top secret\'' }

  # missing or mismatching quotes
--SECRET 'top secret" # { SECRET: "'top secret\"" }
--SECRET 'top secret # { SECRET: "'top secret" }
```

### Parsing an Env File using `.file(options)`

* `Options`: optional object
  * `filePath: string`: (default: `./.env`) relative file path to the `.env` file. _Relative to the starting node script_
  * `encoding: string`: (default `'utf-8'`) file encoding
  * `failIfNotFound: boolean`: (default `false`) if the specified env file was not found, throw an error stopping all processing


`UnifiedEnv` follows the standard `NAME=VALUE` configuration format for `.env`. Notes about parsing: 
* It will look for new `KEY`s on every newline
* It will split on the `=` character
* It will trim whitespace (unless wrapped in quotes)


An example, project: 
```
.
├── .env
└── src
    └── env.ts
```

In **.env**
```
LOG_LEVELS=debug
ENV=dev
```

In **src/env.ts**

``` typescript
const env = new UnifiedEnv({ 
  LOG_LEVEL: true,
  DB_USERNAME: true,
  DB_PASSWORD: true
})
  .file({ filePath: '../.env' }) // relative path
  .generate();

export default env;
```

From root directory, running: 

``` sh
ts-node src/env.ts
```

### Generate Final Env Object with `.generate()`

Important notes about `.generate()`:
* `.generate()` _must_ be called to compile (or "generate") the final env object
* At least one of `.env()`, `.argv()`, or `.file()` _must_ be called first in order for any config to be generated
* Once `.generate()` has been called, no other function can/should be called on `UnifiedEnv`
* `.generate()` _can only be called **once**_ 

### Order Matters

Important notes about order:
* Env variables are parsed in the order they were loaded
* Env variables do not "override" variables that have already been set (with the exception of `tieBreaker` scenarios)

Take this example. Take an `env.ts` environment file that will have the `UnifiedEnv` configuration. If called with the following…

``` sh
MY_VAR=hello ts-node env.ts --MY_VAR=goodbye
```

With the following configuration, the `.env()` `MY_VAR` value will be used because it is called first:
``` typescript 
const env = new UnifiedEnv({ 
  MY_VAR: true
})
  .env()
  .argv()
  .generate();

// env.MY_VAR === 'hello'

export default env;
```

With a `tieBreaker` set to `argv`, the `.argv()` `MY_VAR` value will be _always_ used:
``` typescript 
const env = new UnifiedEnv({ 
  MY_VAR: { required: true, tieBreaker: 'argv' }
})
  .env()
  .argv()
  .generate();

// env.MY_VAR === 'goodbye'

export default env;
```

# Use Cases

## Real Life Example

Given the following app structure: 

``` 
.
├── .env
├── environment.ts
└── app
    └── main.ts
```

**.env**
```
ENV=prod
LOG_LEVEL=info
```

**environment.ts**
``` typescript
const environment = new UnifiedEnv({
  ENV: { required: true, acceptableValues: ['dev', 'test', 'prod'], tieBreaker: 'env' },
  DB_PORT: { required: true, type: Number },
  LOG_LEVEL: { required: false }, 
  REFRESH_DB: { required: true, typ: Boolean, defaultValue: true }
})
  .env()
  .argv()
  .file() // default is '.env'
  .generate();
```

**src/main.ts**
``` typescript
import environment from '../environment';

/* mock app setup */
const app = new MyApp({
  isProd: environment.ENV === 'prod',
  logLevel: environment.LOG_LEVEL
});

const db = new DB({
  port: environment.DB_PORT,
  refreshDb: environment.REFRESH_DB
});
```

Starting the application with the following will provide the necessary variables to `UnifiedEnv`: 
``` sh
ENV=prod ts-node src/main.ts --ENV=dev --DB_PORT=3456
```

`UnifiedEnv` will generate the following object:
``` typescript
{
  ENV: 'prod', // used 'env' tieBreaker
  DB_PORT: 3456, // from argv
  LOG_LEVEL: 'info', // from .env file
  REFRESH_DB: true // from default value
}
```

## Heroku Deployments

[Heroku] was the inspiration for `UnifiedEnv`. It was easier for me to have an `.env` file in my local working project, but in the Heroku
dashboard most environment variables are stored in `process.env` commandline variables. I didn't want to have production level
`.env` files stored in my repo so I always use those `process.env` vars. 

The issue I would run into would be I add a variable to my local `.env` file, finish out the feature I was working on (sometimes would take a week or two, 
push the code to Heroku, and have runtime errors because I forgot to set the new env vars in my test and/or prod Heroku apps. `UnifiedEnv` helps to solve
that problem by allowing validation of env variables before app start up. See [Use a Validation Script](#use-a-validation-script) for more details on how to do that. 

## Use a Validation Script

Most of us have been working on a new fature locally, add a new env variable, and then forget to add it to the test/production environment. We don't always catch
the mistake until our new feature is running in that environment and starts throwing errors. 

`UnifiedEnv` can easily be configured to pre-check our env variables before our app is started. For example, [Heroku] has a [Release Phase](https://devcenter.heroku.com/articles/release-phase) where tasks can be configured to run _before_ the application is released. A simple use case for `UnifiedEnv` to validate env variables before releasing is: 

Example app structure:

```
.
├── src
│   ├── environment.ts
│   └── main.ts
├── package.json
└── Procfile
```

In **src/environment.ts** setup our `UnifiedEnv` configuration: 
``` typescript
const environment = new UnifiedEnv({
  ENV: { required: true, acceptableValues: ['dev', 'test', 'prod'] },
  DB_CONN_STR: { required: true },
  LOG_LEVEL: { required: true, acceptableValues: ['debug', 'info', 'warn', 'error'] }
})
  .env()
  .argv()
  .file() 
  .generate();

export default environment;
```

**src/main.ts** will do application bootstrap, but will import the **environment.ts** file:
``` typescript
import environment from './environment';
// other imports 

// bootstrap application, etc
```

Add a **script** to **package.json**. All this script needs to do, is load the `src/environment.ts`. Heroku will call the script will 
all the configured variables in the Heroku dashboard. 

``` json
{
  "scripts": {
    "validate-env": "ts-node src/environment.ts",
    "start": "ts-node src/main.ts", // example startup script
    // other scripts
  }
}
```

In **Procfile**, add a "release" step and the "web" step (See Heroku's [Procfile docs](https://devcenter.heroku.com/articles/procfile)):
```
release: npm run validate-env
web: npm run start
```

When the `package.json` **validate-env** script is run, if any env variables are missing `UnifiedEnv` will throw an error causing the "release" phase
to fail. Heroku will not release the application until that script passes. This is an excellent way to ensure all env variables are present before starting
an applicaiton in a server environment. 


# Samples

There are several samples with corresponding configuration files. To run the samples, clone the repo and install dependencies: 

``` sh 
# clone repo 
git clone https://github.com/djhouseknecht/unified-env.git
# cd into directory
cd ./unified-env
# install dependencies
npm install # or yarn
```

Run the following npm scripts:

``` sh
# sample using `process.argv`
npm run sample:argv

# sample using `process.env`
npm run sample:env

# sample that throws errors
npm run sample:error

# sample using an `.env` file
npm run sample:file
```

Be sure to check out the scripts in [package.json](package.json) and the configuration: 
* [samples/argv/argv-sample.ts](samples/argv/argv-sample.ts)
* [samples/env/env-sample.ts](samples/env/env-sample.ts)
* [samples/error/error-sample.ts](samples/error/error-sample.ts)
* [samples/file/file-sample.ts](samples/file/file-sample.ts)
  * _and corresponding_ [.env](samples/file/.env)

# Credits 
Idea was originally designed to make [heroku](https://www.heroku.com/) development and deployments easier. It is loosely based on [dotenv](https://www.npmjs.com/package/dotenv) and [nconf](https://www.npmjs.com/package/nconf)

# Coming Soon (TODO)
* create a `load()` function to push all env variables into the process.env
  * maybe have an `exclude` list? 
  * this will probably be an external function
* `IEnvOption`
  * add `false` support for non-required string
  * add `altKeys: string[]` for alternate keys to look for
* `file()` -> add `.json` support
* `IEnvOption` -> better typings (and validation) for `defaultValue` and `acceptableValues`
* `utils#validateExpectedVariables()` -> write this
* `utils#finalTypesMatch()` -> write this

[dependabot]: https://dependabot.com
[Heroku]: https://www.heroku.com/
