[![Build Status](https://travis-ci.org/djhouseknecht/simple-env.svg?branch=master)](https://travis-ci.org/djhouseknecht/simple-env)  [![codecov](https://codecov.io/gh/djhouseknecht/simple-env/branch/master/graph/badge.svg)](https://codecov.io/gh/djhouseknecht/simple-env)  [![npm version](https://badge.fury.io/js/simple-env.svg)](https://badge.fury.io/js/simple-env)  [![dependabot-status](https://flat.badgen.net/dependabot/djhouseknecht/simple-env/?icon=dependabot)][dependabot]  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)  [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) 

# Simple-Env
Simple environmental variables for node applications. Easily configure and use variables throughout your app.

## Basic Usage
Tell `simple-env` (SE) which order you want 

``` bash

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


## Credits 
Idea was originally designed to make [heroku](https://www.heroku.com/) development and deployments easier. It is loosely based on [dotenv](https://www.npmjs.com/package/dotenv) and [nconf](https://www.npmjs.com/package/nconf)

[dependabot]: https://dependabot.com
