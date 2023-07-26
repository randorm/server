# Randorm's server part.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![pipeline status](https://gitlab.pg.innopolis.university/randorm/server/badges/main/pipeline.svg)](https://gitlab.pg.innopolis.university/randorm/server/-/commits/main)
[![coverage report](https://gitlab.pg.innopolis.university/randorm/server/badges/main/coverage.svg)](https://gitlab.pg.innopolis.university/randorm/server/-/commits/main)
[![Latest Release](https://gitlab.pg.innopolis.university/randorm/server/-/badges/release.svg)](https://gitlab.pg.innopolis.university/randorm/server/-/releases)

## Description

The Randorm server is responsible for handling the backend logic of the Randorm
application. It manages the distribution of applicants and students into rooms
based on their interest in each other, with the goal of creating suitable living
arrangements.

## Demo

![preview](.gitlab/preview.gif)

## Installation

To install the Randorm server, follow the steps below:

1. Clone the
   [randorm/server](https://gitlab.pg.innopolis.university/randorm/server/)
   repository
2. Install [Deno](https://deno.land) by following the
   [instruction](https://deno.land/manual@main/getting_started/installation)
3. Setup `BOT_TOKEN` from [@botfather](https://botfather.t.me/) in environment
4. Setup `JWK` as
   [Json Web Key](https://self-issued.info/docs/draft-ietf-jose-json-web-key.html)
   in environment

## How to Use

- Run the server:

```bash
deno run -A --unstable ./mod.ts
```

- Follow the link https://127.0.0.1:3000

## Features

- Open API for third-party apps
- Feed with Recommendation Algorithms
- Distribution Algorithm based on the interests of applicants/students in each
  other

## Tech Stack

| Language | Database | Frameworks 	| Libraries |
|:--------------------------------------------:|:------------------------------:|:--------------------------------------:	|:---------------------------------------------------:|
| Typescript (with [Deno](https://deno.land/)) | [Deno KV](https://deno.com/kv)
| [grammY](https://grammy.dev/)|
[graphql-js](https://github.com/graphql/graphql-js) | | | |
[oak](https://deno.land/x/oak@v12.5.0)|
[deno_std](https://deno.land/std@0.194.0) |

## For Customer

We highly value your satisfaction and want to provide you with the best possible
support. If you encounter any problems or have any questions regarding our
product or service, please don't hesitate to create an **issue**. Our team is
here to assist you and will promptly address your concerns. Your feedback is
crucial for us to continually improve our offerings, and we appreciate the
opportunity to assist you. Thank you for choosing us as your trusted provider,
and we assure you of our commitment to your satisfaction.

## License

This project is licensed under the
[MIT License](https://license.md/licenses/mit-license/) - see the
[LICENSE](LICENSE) file for details.
